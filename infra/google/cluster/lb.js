"use strict";
const async = require("async");

const google = require('googleapis');
const v1Compute = google.compute('v1');
const v1Container = google.container('v1');

const config = require('../config');

function getConnector(opts) {
	return {
		project: opts.project,
		projectId: opts.project,
		auth: new google.auth.JWT(
			opts.token.client_email,
			null,
			opts.token.private_key,
			config.scopes, // an array of auth scopes
			null
		)
	};
}

const GCLB = {
	
	/**
	 * This method add service published ports to firewall rules
	 * @param options
	 * @param cb
	 * @returns {*}
	 */
	"publishPorts": function (options, cb) {
		let request = getConnector(options.infra.api);
		let stack = options.infra.stack;
		let ports = [];
		
		options.params.ports.forEach(function (onePort) {
			if (onePort.published) {
				if (parseInt(onePort.published) < 30000) {
					onePort.published = parseInt(onePort.published) + 30000;
				}
				onePort.published = onePort.published.toString();
				ports.push(onePort.published);
			}
		});
		options.params.ports = ports;
		
		if (ports.length === 0) {
			return cb(null, true);
		}
		
		let project = request.project;
		delete request.project;
		request.zone = stack.options.zone;
		request.clusterId = stack.id;
		options.soajs.log.debug("Getting Cluster network name...");
		v1Container.projects.zones.clusters.get(request, function (err, clusterInformation) {
			if (err) {
				options.soajs.log.error(err);
				return cb(new Error(`Failed to find ${stack.id} cluster!`));
			}
			if (!clusterInformation || clusterInformation === '' || typeof clusterInformation !== 'object' || Object.keys(clusterInformation).length === 0) {
				options.soajs.log.debug("Cluster Not found!");
				return cb(new Error(`Failed to find ${ stack.id} cluster!`));
			}
			else {
				request.filter = "network eq " + "https://www.googleapis.com/compute/v1/projects/" + options.infra.api.project + "/global/networks/" + clusterInformation.network;
				request.project = project;
				v1Compute.firewalls.list(request, (err, firewalls) => {
					if (err) {
						options.soajs.log.error(err);
						return cb(new Error(`Failed to find ${stack.name} network!`));
					}
					let name = stack.name + "-allow-tcp-";
					if (options.params.name) {
						name += options.params.name;
					}
					else {
						if (options.params.name === 'nginx') {
							name += options.params.envCode.toLowerCase() + "-" + options.params.name;
						}
						else if (options.params.name && options.params.version) {
							name += options.params.envCode.toLowerCase() + "-" + options.params.name;
							name += "-v" + options.params.version;
						}
						else {
							name += options.params.envCode.toLowerCase() + "-" + options.params.type;
							name += (options.params.version) ? "-v" + options.params.version : "";
						}
					}
					
					async.detect(firewalls.items, function (oneFireWall, call) {
						return call(null, oneFireWall.name === name)
					}, function (err, result) {
						if (err) {
							return cb(err);
						}
						else {
							let method = 'insert';
							if (result) {
								options.soajs.log.debug("Update firewall rule: ", name);
								//service found update firewall
								request.firewall = name;
								method = 'update';
							}
							else {
								//create new firewall
								options.soajs.log.debug("Registering new firewall rule: ", name);
							}
							request.resource = {
								//gcloud compute --project=ragheb-project firewall-rules create template-cluster-allow-icmp --description=Allows\ ICMP\ connections\ from\ any\ source\ to\ any\ instance\ on\ the\ network. --direction=INGRESS --priority=65534 --network=template-cluster --action=ALLOW --rules=icmp --source-ranges=0.0.0.0/0
								"kind": "compute#firewall",
								"name": name,
								"description": "Allow tcp Connections for " + name,
								"network": "projects/" + options.infra.api.project + "/global/networks/" + clusterInformation.network,
								"priority": 65534,
								"sourceRanges": "0.0.0.0/0",
								"allowed": [
									{
										"IPProtocol": "tcp",
										"ports": ports
									}
								]
							};
							v1Compute.firewalls[method](request, function (err) {
								if (err) {
									options.soajs.log.error(err);
									return cb(new Error(`Failed to add ${ports} to Firewall Rules!`));
								}
								else {
									return cb(null, true);
								}
							});
						}
					});
				});
			}
		});
	},
	
	"deployExternalLb": function (options, cb) {
		return cb(null, true);
	},
	
	"updateExternalLB": function (options, cb) {
		return cb(null, true);
	},
	
	"deleteExternalLB": function (options, cb) {
		return cb(null, true);
	}
};

module.exports = GCLB;