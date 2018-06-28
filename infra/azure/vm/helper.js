'use strict';

const async = require('async');

const config = require('./config');

const helper = {

	buildVMRecord: function (opts) {
		let record = {};

		if (opts.vm) {
			if (opts.vm.name) record.name = opts.vm.name;
			if (opts.vm.name) record.id = opts.vm.name;

			record.labels = {};
			if (opts.vm.tags) record.labels = opts.vm.tags;
			if (opts.vm.location) record.labels['soajs.service.vm.location'] = opts.vm.location;
			if (opts.vm.id) {
				let idInfo = opts.vm.id.split('/');
				record.labels['soajs.service.vm.group'] = idInfo[idInfo.indexOf('resourceGroups') + 1];
			}
			if (opts.vm.hardwareProfile && opts.vm.hardwareProfile.vmSize) record.labels['soajs.service.vm.size'] = opts.vm.hardwareProfile.vmSize;

			record.ports = [];
			record.voluming = {};

			record.tasks = [];
			record.tasks[0] = {};
			if (opts.vm.name) record.tasks[0].id = opts.vm.name;
			if (opts.vm.name) record.tasks[0].name = opts.vm.name;

			record.tasks[0].status = {};
			if (opts.vm.provisioningState) record.tasks[0].status.state = opts.vm.provisioningState.toLowerCase();
			if (opts.vm.provisioningState) record.tasks[0].status.ts = new Date().getTime();

			record.tasks[0].ref = {os: {}};
			if (opts.vm.storageProfile) {
				if (opts.vm.storageProfile.osDisk) {
					if (opts.vm.storageProfile.osDisk.osType) record.tasks[0].ref.os.type = opts.vm.storageProfile.osDisk.osType;
					if (opts.vm.storageProfile.osDisk.diskSizeGB) record.tasks[0].ref.os.diskSizeGB = opts.vm.storageProfile.osDisk.diskSizeGB;
				}
				if(opts.vm.storageProfile.dataDisks) {
					record.voluming.volumes = [];
					opts.vm.storageProfile.dataDisks.forEach(function(oneDisk) {
						record.voluming.volumes.push({
							name: oneDisk.name,
							type: 'data',
							caching: oneDisk.caching,
							diskSizeGb: oneDisk.diskSizeGb,
							storageType: (oneDisk.managedDisk && oneDisk.managedDisk.storageAccountType) ? oneDisk.managedDisk.storageAccountType : ''
						});
					});
				}
			}
		}

		record.env = [];
		record.ip = [];

		if(opts.publicIp && opts.publicIp.ipAddress) {
			record.ip.push({
				type: 'public',
				allocatedTo: 'instance',
				address: opts.publicIp.ipAddress
			});
		}

		if(opts.networkInterface && opts.networkInterface.ipConfigurations){
			opts.networkInterface.ipConfigurations.forEach(function(oneIpConfig) {
				if(oneIpConfig.privateIPAddress) {
					record.ip.push({
						type: 'private',
						allocatedTo: 'instance',
						address: oneIpConfig.privateIPAddress
					});
				}
			});
		}

		if (opts.securityGroup && opts.securityGroup.securityRules) {
			record.ports = helper.buildPortsArray(opts.securityGroup.securityRules);
		}

		if(opts.subnet && opts.subnet.name) {
			record.layer = opts.subnet.name;
		}

		if(opts.virtualNetworkName) {
			record.network = opts.virtualNetworkName;
		}

		if(opts.loadBalancers && Array.isArray(opts.loadBalancers) && opts.loadBalancers.length > 0) {
			record.loadBalancers = [];
			opts.loadBalancers.forEach(function(oneLoadBalancer) {
				let loadBalancerRecord = helper.buildLoadBalancerRecord({ loadBalancer: oneLoadBalancer, publicIpsList: opts.publicIpsList });
				record.loadBalancers.push(loadBalancerRecord);

				if(loadBalancerRecord.ipAddresses && Array.isArray(loadBalancerRecord.ipAddresses)) {
					loadBalancerRecord.ipAddresses.forEach(function(oneRecord) {
						record.ip.push({
							type: oneRecord.type,
							allocatedTo: 'loadBalancer',
							address: oneRecord.address
						});
					});
				}
			});
		}

		// record.servicePortType = "";

		return record;
	},

	buildResourceGroupRecord: function(opts) {
		let record = {};

		if(opts.resourceGroup) {
			if(opts.resourceGroup.id) record.id = opts.resourceGroup.id;
			if(opts.resourceGroup.name) record.name = opts.resourceGroup.name;
			if(opts.resourceGroup.location) record.region = opts.resourceGroup.location;
			if(opts.resourceGroup.tags) record.labels = opts.resourceGroup.tags;
		}

		return record;
	},

	buildVmSizes: function (opts) {
		let record = {};

        if(opts.vmSize) {
            if (opts.vmSize.name) record.name = opts.vmSize.name;
			if (opts.vmSize.numberOfCores) record.numberOfCores = opts.vmSize.numberOfCores;
			if (opts.vmSize.osDiskSizeInMB) record.osDiskSizeInMB = opts.vmSize.osDiskSizeInMB;
			if (opts.vmSize.resourceDiskSizeInMB) record.resourceDiskSizeInMB = opts.vmSize.resourceDiskSizeInMB;
			if (opts.vmSize.memoryInMB) record.memoryInMB = opts.vmSize.memoryInMB;
    		if (opts.vmSize.maxDataDiskCount) record.maxDataDiskCount = opts.vmSize.maxDataDiskCount;

	        record.label = record.name + ` / CPU: ${record.numberOfCores}`;
	        let memory = record.memoryInMB;
	        if(memory > 1024){
	        	memory = memory / 1024;
		        record.label += ` / RAM: ${memory}GB`;
	        }
	        else{
		        record.label += ` / RAM: ${memory}MB`;
	        }

	        let hd = record.resourceDiskSizeInMB;
	        if(hd > 1024){
	        	hd = hd / 1024;
		        record.label += ` / HD: ${hd}GB`;
	        }
	        else{
	            record.label += ` / HD: ${hd}MB`;
	        }
        }

		return record;
	},

	buildRunCommmand: function(opts){
		let record ={};

		if(opts.runCommand){
			if (opts.runCommand.name) record.name = opts.runCommand.name;
    		if (opts.runCommand.status) record.status = opts.runCommand.status;
		}

		return record;
	},

	buildVmImagePublisherssRecord: function (opts) {
		let record = {};

        if(opts.imagePublisher) {
            if (opts.imagePublisher.name) record.name = opts.imagePublisher.name;
    		if (opts.imagePublisher.id) record.id = opts.imagePublisher.id;
			if (opts.imagePublisher.location) record.location = opts.imagePublisher.location;
        }

		return record;
	},

	buildVmImagePublishersOffersRecord: function (opts) {
		let record = {};

		if(opts.imageOffer) {
			if (opts.imageOffer.name) record.name = opts.imageOffer.name;
			if (opts.imageOffer.id) record.id = opts.imageOffer.id;
			if (opts.imageOffer.location) record.location = opts.imageOffer.location;
			if(opts.imageOffer.publisher) record.publisher = opts.imageOffer.publisher;
			if(opts.imageOffer.imageName) record.imageName = opts.imageOffer.imageName;
        }

		return record;
	},


	buildVmImageVersionsRecord: function (opts) {
		let record = {};

		if(opts.imageVersion) {
			if (opts.imageVersion.name) record.name = opts.imageVersion.name;
			if (opts.imageVersion.id) record.id = opts.imageVersion.id;
			if (opts.imageVersion.location) record.location = opts.imageVersion.location;
			if(opts.imageVersion.publisher) record.publisher = opts.imageVersion.publisher;
			if(opts.imageVersion.imageName) record.imageName = opts.imageVersion.imageName;
        }

		return record;
	},

	buildDiskRecord: function (opts) {
		let record = {};

		if(opts.disk) {
			if (opts.disk.name) record.name = opts.disk.name;
			if (opts.disk.id) record.id = opts.disk.id;
			if (opts.disk.location) record.location = opts.disk.location;
			if (opts.disk.diskSizeGb) record.diskSizeGb = opts.disk.diskSizeGb;
			if (opts.disk.type) record.type = opts.disk.type;
			if (opts.disk.storageType) record.storageType = opts.disk.storageType;
        }

		return record;
	},

	buildNetworkRecord: function (opts) {
		let record = {};
		record.subnets = [];
		if(opts.network) {
			if (opts.network.name) record.name = opts.network.name;
			if (opts.network.id) record.id = opts.network.id;
			if (opts.network.location) record.location = opts.network.location;
			if (opts.network.subnets) {
				for(let i = 0 ; i < opts.network.subnets.length ; i++){
					record.subnets.push(  helper.bulidSubnetsRecord({subnets :opts.network.subnets[i] }));
				}
			}
			if(opts.network.addressSpace) record.addressSpace = opts.network.addressSpace;
		}

		return record;
	},

	buildLoadBalancerRecord: function (opts) {
		let record = {};
		if(opts.loadBalancer){
			if (opts.loadBalancer.name) record.name = opts.loadBalancer.name;
			if (opts.loadBalancer.id) record.id = opts.loadBalancer.id;
			if (opts.loadBalancer.location) record.region = opts.loadBalancer.location;

			if(opts.loadBalancer.frontendIPConfigurations && Array.isArray(opts.loadBalancer.frontendIPConfigurations) && opts.loadBalancer.frontendIPConfigurations.length > 0) {
				record.ipAddresses = [];
				opts.loadBalancer.frontendIPConfigurations.forEach(function(oneConfig) {
					let oneEntry = {};
					if(oneConfig.privateIPAddress) {
						oneEntry.address = oneConfig.privateIPAddress;
						oneEntry.type = 'private';
					}
					if(oneConfig.publicIPAddress && oneConfig.publicIPAddress.id) {
						if(opts.publicIpsList) {
							for (let i = 0; i < opts.publicIpsList.length; i++) {
								if(opts.publicIpsList[i].id === oneConfig.publicIPAddress.id) {
									oneEntry.type = 'public';
									oneEntry.name = opts.publicIpsList[i].name || '';
									oneEntry.address = opts.publicIpsList[i].ipAddress || '';
									break;
								}
							}
						}
					}
					record.ipAddresses.push(oneEntry);
				});
			}
		}

		return record;
	},


	bulidSubnetsRecord: function (opts) {
		let record = {};
		if(opts.subnet){
			if (opts.subnet.name) record.name = opts.subnet.name;
			if (opts.subnet.id) record.id = opts.subnet.id;
			if (opts.subnet.location) record.region = opts.subnet.location;
			if (opts.subnet.addressPrefix) record.addressPrefix = opts.subnet.addressPrefix;
		}

		return record;
	},

	buildPublicIPsRecord: function (opts) {
		let record = {}
		if(opts.publicIPAddresse){
			if (opts.publicIPAddresse.name) record.name = opts.publicIPAddresse.name;
			if (opts.publicIPAddresse.id) record.id = opts.publicIPAddresse.id;
			if (opts.publicIPAddresse.location) record.location = opts.publicIPAddresse.location;
			if (opts.publicIPAddresse.ipAddress) record.ipAddress = opts.publicIPAddresse.ipAddress;
			if (opts.publicIPAddresse.publicIPAllocationMethod) record.publicIPAllocationMethod = opts.publicIPAddresse.publicIPAllocationMethod;
			if (opts.publicIPAddresse.tags) record.tags = opts.publicIPAddresse.tags;
		}
		return record;
	},
	buildSecurityGroupsRecord: function (opts) {

		let record = {};
		if(opts.networkSecurityGroups){
			if (opts.networkSecurityGroups.name) record.name = opts.networkSecurityGroups.name;
			if (opts.networkSecurityGroups.id) record.id = opts.networkSecurityGroups.id;
			if (opts.networkSecurityGroups.region) record.region = opts.networkSecurityGroups.region;
			if (opts.networkSecurityGroups.ports){
				for(let i = 0 ; i < opts.networkSecurityGroups.ports.length ; i++){
					record.ports.push(  helper.builddPortsRecord({subnet :opts.networkSecurityGroups.ports[i] }));
				}
			}
			if (opts.networkSecurityGroups.tags) record.tags = opts.networkSecurityGroups.tags;
		}
		return record;
	},

	builddPortsRecord: function (opts) {
		let record = {};
		if(opts.ports){
			if (opts.ports.name) record.name = opts.ports.name;
			if (opts.ports.target) record.target = opts.ports.target;
			if (opts.ports.published) record.published = opts.ports.published;
			if (opts.ports.isPublished) record.isPublished = opts.ports.isPublished;
		}

		return record;
	},

	buildSecurityRules: function (ports) {
		let securityRules = [];
		let priority = 100;

		if (Array.isArray(ports)) {
			ports.forEach(onePort => {
				securityRules.push({
					name: onePort.name,
					properties: {
						priority: priority,
						protocol: "*",
						access: "Allow",
						direction: "Inbound",
						sourceAddressPrefix: "*",
						sourcePortRange: "*",
						destinationAddressPrefix: "*",
						destinationPortRange: (onePort.published) ? onePort.published : (Math.floor(Math.random() * 2768) + 30000)
					}
				});
				priority += 10;
			});
		}

		return securityRules;
	},

	buildPortsArray: function (securityRules) {
		let output = [];

		securityRules.forEach(function (oneSecurityRule) {
			output.push({
				protocol: (oneSecurityRule.protocol && oneSecurityRule.protocol === '*') ? 'tcp/udp' : oneSecurityRule.protocol,
				target: oneSecurityRule.sourcePortRange,
				published: oneSecurityRule.destinationPortRange,
				isPublished: (oneSecurityRule.destinationPortRange) ? true : false
			});
		});

		return output;
	},

	filterVMs: function (group, vms, cb) {
		async.filter(vms, function (oneVm, callback) {
			let valid = false;
			if (!oneVm.tags || Object.keys(oneVm.tags).length === 0) valid = true;
			else if (group && oneVm.tags && oneVm.tags['soajs.content'] === 'true' && oneVm.tags['soajs.env.code'] === group) valid = true;
			else if (oneVm.tags && (!oneVm.tags['soajs.content'] || oneVm.tags['soajs.content'] !== 'true')) valid = true;

			return callback(null, valid);
		}, cb);
	},

	getVmNetworkInfo: function (networkClient, opts, cb) {
		let idInfo, resourceGroupName, networkInterfaceName, networkSecurityGroupName, ipName, subnetName, vnetName;
		if (opts.vm.id) {
			idInfo = opts.vm.id.split('/');
			resourceGroupName = idInfo[idInfo.indexOf('resourceGroups') + 1];
		}

		if (opts.vm.networkProfile && opts.vm.networkProfile.networkInterfaces && Array.isArray(opts.vm.networkProfile.networkInterfaces)) {
			for (let i = 0; i < opts.vm.networkProfile.networkInterfaces.length; i++) {
				if (opts.vm.networkProfile.networkInterfaces[i].primary) {
					networkInterfaceName = opts.vm.networkProfile.networkInterfaces[i].id.split('/').pop();
					break;
				}
			}
			//if no primary interface was found, use the first in the array
			if (!networkInterfaceName && opts.vm.networkProfile.networkInterfaces[0] && opts.vm.networkProfile.networkInterfaces[0].id) {
				networkInterfaceName = opts.vm.networkProfile.networkInterfaces[0].id.split('/').pop();
			}
		}

		networkClient.networkInterfaces.get(resourceGroupName, networkInterfaceName, function (error, networkInterface) {
			if (error) return cb(error);

			if (networkInterface && networkInterface.networkSecurityGroup && networkInterface.networkSecurityGroup.id) {
				networkSecurityGroupName = networkInterface.networkSecurityGroup.id.split('/').pop();
			}

			if (networkInterface && networkInterface.ipConfigurations && Array.isArray(networkInterface.ipConfigurations)) {
				for (let i = 0; i < networkInterface.ipConfigurations.length; i++) {
					if(networkInterface.ipConfigurations[i].primary) {
						if (networkInterface.ipConfigurations[i].publicIPAddress) {
							ipName = networkInterface.ipConfigurations[i].publicIPAddress.id.split('/').pop();
						}
						if(networkInterface.ipConfigurations[i].subnet) {
							// sample subnet id: /subscriptions/xxxxxxxxx/resourceGroups/test/providers/Microsoft.Network/virtualNetworks/test-vn/subnets/test-subnet
							let subnetInfo = networkInterface.ipConfigurations[i].subnet.id.split('/');
							subnetName = subnetInfo.pop();
							vnetName = subnetInfo[subnetInfo.indexOf('virtualNetworks') + 1];
						}

						break;
					}
				}
			}

			async.auto({
				getSecurityGroup: function(callback) {
					networkClient.networkSecurityGroups.get(resourceGroupName, networkSecurityGroupName, function (error, securityGroup) {
						if (error) opts.log.warn(`Unable to get security group ${networkSecurityGroupName}`);
						return callback(null, securityGroup || {});
					});
				},
				getPublicIp: function(callback) {
					if (!ipName){
						return callback(null, true);
					}
					networkClient.publicIPAddresses.get(resourceGroupName, ipName, function (error, publicIp) {
						if (error) opts.log.warn(`Unable to get public ip address ${ipName}`);
						return callback(null, publicIp || {});
					});
				},
				getSubnet: function(callback) {
					networkClient.subnets.get(resourceGroupName, vnetName, subnetName, function(error, subnet) {
						if (error) opts.log.warn(`Unable to get subnet ${subnetName} in network ${vnetName}`);
						return callback(null, subnet || {});
					});
				},
				getLoadBalancers: function(callback) {
					networkClient.networkInterfaceLoadBalancers.list(resourceGroupName, networkInterfaceName, function(error, loadBalancers) {
						if (error) opts.log.warn(`Unable to get load balancers for network interface ${networkInterfaceName}`);
						return callback(null, loadBalancers || []);
					});
				}
			}, function(error, results) {
				return cb(null, {
					networkInterface,
					securityGroup: results.getSecurityGroup,
					publicIp: results.getPublicIp,
					subnet: results.getSubnet,
					loadBalancers: results.getLoadBalancers,
					virtualNetworkName: vnetName
				});
			});
		});
	},

	listPublicIps: function(networkClient, opts, cb) {
		networkClient.publicIPAddresses.listAll(function (error, publicIps) {
			if(error) return cb(error);
			return cb(null, publicIps);
		});
	}
};

module.exports = helper;
