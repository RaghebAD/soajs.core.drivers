"use strict";
const crypto = require('crypto');
const Docker = require('dockerode');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const dockerDriver = require("../../../lib/container/docker/index.js");

const LBDriver = require("../cluster/lb.js");
const helper = require("./helper.js");

let driver = {
	
	/**
	 * Execute Deploy Cluster Pre Operation
	 * @param options
	 * @param cb
	 * @returns {*}
	 */
	"deployClusterPre": function (options, cb) {
		
		options.soajs.log.debug("Generating docker token");
		crypto.randomBytes(1024, function (err, buffer) {
			if (err) {
				return cb(err);
			}
			options.soajs.registry.deployer.container.docker.remote.apiProtocol = 'https';
			options.soajs.registry.deployer.container.docker.remote.apiPort = 32376;
			options.soajs.registry.deployer.container.docker.remote.auth = {
				token: buffer.toString('hex')
			};
			return cb(null, true);
		});
	},
	
	/**
	 * Execute Deploy Cluster Post
	 * @param options
	 * @param cb
	 * @returns {*}
	 */
	"deployClusterPost": function (options, cb) {
		return cb(null, true);
	},
	
	/**
	 * @param options
	 * @param cb
	 * @returns {*}
	 */
	"getDeployClusterStatusPre": function (options, cb) {
		return cb(null, true);
	},
	
	/**
	 * This method deploys the default soajsnet for docker
	 * @param options
	 * @param cb
	 * @returns {*}
	 */
	"getDeployClusterStatusPost": function (options, cb) {
		let out = options.out;
		let stack = options.infra.stack;
		
		if (out.ip && stack.options.ElbName) {
			options.soajs.log.debug("Creating SOAJS network.");
			const deployer = new Docker({
				protocol: options.soajs.registry.deployer.container.docker.remote.apiProtocol,
				port: options.soajs.registry.deployer.container.docker.remote.apiPort,
				host: out.ip,
				headers: {
					'token': options.soajs.registry.deployer.container.docker.remote.auth.token
				}
			});
			let networkParams = {
				Name: 'soajsnet',
				Driver: 'overlay',
				Internal: false,
				Attachable: true,
				CheckDuplicate: true,
				EnableIPv6: false,
				IPAM: {
					Driver: 'default'
				}
			};
			
			deployer.createNetwork(networkParams, (err) => {
				if (err && err.statusCode === 403) {
					return cb(null, true);
				}
				return cb(err, true);
			});
		}
		else {
			return cb(null, false);
		}
	}
};

Object.assign(driver, dockerDriver);

/**
 * Override default dockerDriver.deleteService, add extra Logic to clean up load balancer if any
 * @param options
 * @param cb
 */
driver.deleteService = function(options, cb){
	console.log(options.params);
	dockerDriver.inspectService(options, (error, deployedServiceDetails) => {
		if(error){
			return cb(error);
		}
		
		if(!deployedServiceDetails){
			return cb(null, true);
		}
		
		options.params.id = options.params.serviceId;
		console.log(options.params);
		dockerDriver.deleteService(options, (error) => {
			if(error){
				return cb(error);
			}
			
			let info = helper.getDeploymentFromInfra(options.infra, options.env);
			if(!info){
				return cb(null, true);
			}
			
			//if there is a load balancer for this service make a call to drivers to delete it
			let infraStack = info[0];
			console.log(infraStack);
			if (infraStack.loadBalancers && infraStack.loadBalancers[options.env.toUpperCase()]
				&& infraStack.loadBalancers[options.env.toUpperCase()][deployedServiceDetails.service.labels['soajs.service.name']]
				&& infraStack.loadBalancers[options.env.toUpperCase()][deployedServiceDetails.service.labels['soajs.service.name']].name) {
				options.params = {
					envCode: options.env.toLowerCase(),
					info: info,
					name: deployedServiceDetails.service.labels['soajs.service.name'],
					ElbName: infraStack.loadBalancers[options.env.toUpperCase()][deployedServiceDetails.service.labels['soajs.service.name']].name
				};
				options.infra.stack = infraStack;
				LBDriver.deployExternalLb(options, cb);
			}
			else {
				return cb(null, true);
			}
		});
	});
};

module.exports = driver;