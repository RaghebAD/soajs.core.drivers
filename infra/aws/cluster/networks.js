'use strict';

const async = require('async');
const utils = require("../utils/utils");
const helper = require('../utils/helper.js');
const subnetDriver = require('./subnets.js');
const _ = require('lodash');

const config = require("../config");

function getConnector(opts) {
	return utils.getConnector(opts, config);
}

const driver = {

	/**
	 * List available networks

	 * @param  {Object}   options  Data passed to function as params
	 * @param  {Function} cb    Callback function
	 * @return {void}
	 */
	list: function (options, cb) {
		const aws = options.infra.api;

		const ec2 = getConnector({
			api: 'ec2',
			region: options.params.region,
			keyId: aws.keyId,
			secretAccessKey: aws.secretAccessKey
		});

		ec2.describeVpcs({}, function (err, networks) {
			if (err) {
				return cb(err);
			}
			if (networks && networks.Vpcs && Array.isArray(networks.Vpcs) && networks.Vpcs.length > 0) {
				async.map(networks.Vpcs, function (network, callback) {
					options.params.network = network.VpcId;
					subnetDriver.list(options, (err, subnets) => {
						return callback(err, helper.buildNetworkRecord({
							network,
							region: options.params.region,
							subnets
						}));
					});
				}, cb);
			}
			else {
				return cb(null, []);
			}
		});
	},

	/**
	 * Create a new network

	 * @param  {Object}   options  Data passed to function as params
	 * @param  {Function} cb    Callback function
	 * @return {void}
	 */
	create: function (options, cb) {

		const aws = options.infra.api;
		const ec2 = getConnector({
			api: 'ec2',
			region: options.params.region,
			keyId: aws.keyId,
			secretAccessKey: aws.secretAccessKey
		});
		let params = {
			CidrBlock: options.params.address, /* required */
			AmazonProvidedIpv6CidrBlock: options.params.Ipv6Address || false,
			DryRun: false,
			InstanceTenancy: options.params.InstanceTenancy || "default", // "host" || "dedicated" || "default"
		};
		//Ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#createVpc-property
		ec2.createVpc(params, function (err, response) {
			if (err) {
				return cb(err);
			}
			return cb(null, response);
		});
	},

	/**
	 * Update a network

	 * @param  {Object}   options  Data passed to function as params
	 * @param  {Function} cb    Callback function
	 * @return {void}
	 */
	update: function (options, cb) {
		//get the vpc
		//update tenancy to default
		//associate a new address
		//disassociate an address other than primary
		const aws = options.infra.api;
		const ec2 = getConnector({
			api: 'ec2',
			region: options.params.region,
			keyId: aws.keyId,
			secretAccessKey: aws.secretAccessKey
		});
		let params = {
			VpcIds: [
				options.params.name
			]
		};
		ec2.describeVpcs(params, function (err, networks) {
			if (err) {
				return cb(err);
			}
			if (networks && networks.Vpcs && Array.isArray(networks.Vpcs) && networks.Vpcs.length > 0) {
				let network = networks.Vpcs[0];
				let cidR = [];
				let addresses = [];
				// get addresses without primary
				network.CidrBlockAssociationSet.forEach((oneCidR) => {
					if (oneCidR.CidrBlock !== network.CidrBlock) {
						cidR.push(oneCidR.CidrBlock);
					}
				});
				if (options.params && options.params.addresses){
					options.params.addresses.forEach((oneAddress) => {
						if (oneAddress) {
							addresses.push(oneAddress);
						}
					});
				}
				async.parallel({
					address: function (callback) {
						if (addresses && Array.isArray(addresses) && addresses.length > 0) {
							//get primary address
							let primIndex = addresses.indexOf(network.CidrBlock);
							if (primIndex === -1) {
								return callback(new Error("Primary Network address can't be modified."));
							}
							else {
								addresses.splice(primIndex, 1);
								async.parallel({
									addedCidr: function (mini) {
										//associateVpcCidrBlock
										driver.addNetworkAddresses(ec2, options.params.network, _.difference(addresses, cidR), options.params.addresses, mini);
									},
									removedCidr: function (mini) {
										//disassociateAddress
										driver.removeNetworkAddresses(ec2, _.difference(cidR, options.params.address), network, options.params.addresses, mini);
									}
								}, callback);
							}
						}
						else {
							return callback(new Error("Invalid network address"));
						}
					},
					InstanceTenancy: function (callback) {
						if (options.params.instanceTenancy && options.params.instanceTenancy !== network.InstanceTenancy) {
							if (options.params.instanceTenancy === "default") {
								let params = {
									tenancy: "default", /* required */
								};
								ec2.modifyVpcTenancy(params, callback);
							}
							else {
								return callback(new Error(`You cannot change the instance tenancy attribute to ${options.params.instanceTenancy}`));
							}
						}
						else {
							callback();
						}
					}
				}, cb);
			}
			else {
				return cb(new Error("Vpc network not found"));
			}
		});
	},

	/**
	 * Delete a network

	 * @param  {Object}   options  Data passed to function as params
	 * @param  {Function} cb    Callback function
	 * @return {void}
	 */
	delete: function (options, cb) {
		const aws = options.infra.api;
		const ec2 = getConnector({
			api: 'ec2',
			region: options.params.region,
			keyId: aws.keyId,
			secretAccessKey: aws.secretAccessKey
		});
		let params = {
			VpcId: options.params.name, /* required */
		};
		//Ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#deleteVpc-property
		ec2.deleteVpc(params, function (err, response) {
			if (err) {
				return cb(err);
			}
			return cb(null, response);
		});
	},
	/**
	 * add multiple network addresses
	 * @param ec2
	 * @param network
	 * @param addresses
	 * @param list
	 * @param cb
	 */
	addNetworkAddresses: function (ec2, network, addresses, list, cb) {
		async.each(addresses, function (oneAddress, callback) {
			let params = {
				VpcId: network,
				CidrBlock: oneAddress
			};
			let found = _.find(list, {address: oneAddress});
			params.AmazonProvidedIpv6CidrBlock = found && found.ipv6 ? found.ipv6 : false;
			ec2.associateVpcCidrBlock(params, callback);
		}, cb);
	},
	/**
	 * remove multiple network addresses
	 * @param ec2
	 * @param addresses
	 * @param network
	 * @param list
	 * @param cb
	 */
	removeNetworkAddresses: function (ec2, addresses, network, list, cb) {
		async.each(addresses, function (oneAddress, callback) {
			async.each(network.CidrBlockAssociationSet, function (oneBlock, miniCB) {
				if (oneBlock.CidrBlock !== oneAddress) {
					return miniCB();
				}
				let params = {
					AssociationId: oneBlock.AssociationId
				};
				ec2.disassociateVpcCidrBlock(params, miniCB);
			}, callback);
		}, cb);
	},

};

module.exports = driver;
