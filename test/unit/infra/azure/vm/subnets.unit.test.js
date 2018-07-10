"use strict";
const helper = require("../../../../helper");
const assert = require("assert");
const sinon = require('sinon');

const service = helper.requireModule('./infra/azure/index.js');
const serviceUtils = helper.requireModule("./infra/azure/utils/index.js");

let dD = require('../../../../schemas/azure/cluster.js');
let info = {};
let options = {};

describe("testing /lib/azure/index.js", function () {
	process.env.SOAJS_CLOOSTRO_TEST = true;

	describe("calling executeDriver - listSubnets", function () {
		afterEach((done) => {
			sinon.restore();
			done();
		});
		it("Success", function (done) {
			info = dD();
			options = info.deployCluster;
			sinon
				.stub(serviceUtils, 'authenticate')
				.yields(null, {
					credentials: {},
				});
			sinon
				.stub(serviceUtils, 'getConnector')
				.returns({
					subnets: {
						list: (resourceGroupName, virtualNetworkName, cb) => {
							return cb(null, info.subnets)
						}
					},
				});
			options.params = {
				resourceGroupName: "tester",
				virtualNetworkName: "tester-vn",
			};
			service.executeDriver('listSubnets', options, function (error, response) {
				assert.ifError(error);
				assert.ok(response);
				assert.deepEqual(response, info.subnets);
				done();
			});
		});
	});
	
	describe("calling executeDriver - createSubnet", function () {
		afterEach((done) => {
			sinon.restore();
			done();
		});
		it("Success", function (done) {
			info = dD();
			options = info.deployCluster;
			sinon
				.stub(serviceUtils, 'authenticate')
				.yields(null, {
					credentials: {},
				});
			sinon
				.stub(serviceUtils, 'getConnector')
				.returns({
					subnets: {
						createOrUpdate: (resourceGroupName, virtualNetworkName, subnetName, params, cb) => {
							return cb(null, {
								"id": "/subscriptions/d6/resourceGroups/testcase/providers/Microsoft.Network/virtualNetworks/test-net/subnets/test-sn",
								"addressPrefix": "10.0.0.0/24",
								"provisioningState": "Succeeded",
								"name": "test-sn",
								"etag": "W/\"9db2f506-2b45-4546-ba87-9edefdddf432\""
							})
						}
					},
				});
			options.params = {
				group: "testcase",
				virtualNetworkName: "test-net",
				subnetName: "test-sn",
			};
			service.executeDriver('createSubnet', options, function (error, response) {
				assert.ifError(error);
				assert.ok(response);
				assert.deepEqual(response, {
					"name": "test-sn",
					"id": "/subscriptions/d6/resourceGroups/testcase/providers/Microsoft.Network/virtualNetworks/test-net/subnets/test-sn",
					"addressPrefix": "10.0.0.0/24"
				});
				done();
			});
		});
	});
	
	describe("calling executeDriver - updateSubnet", function () {
		afterEach((done) => {
			sinon.restore();
			done();
		});
		it("Success", function (done) {
			info = dD();
			options = info.deployCluster;
			sinon
				.stub(serviceUtils, 'authenticate')
				.yields(null, {
					credentials: {},
				});
			sinon
				.stub(serviceUtils, 'getConnector')
				.returns({
					subnets: {
						createOrUpdate: (resourceGroupName, virtualNetworkName, subnetName, params, cb) => {
							return cb(null, {
								"id": "/subscriptions/d6/resourceGroups/testcase/providers/Microsoft.Network/virtualNetworks/test-net/subnets/test-sn",
								"addressPrefix": "10.0.0.0/24",
								"provisioningState": "Succeeded",
								"name": "test-sn",
								"etag": "W/\"9db2f506-2b45-4546-ba87-9edefdddf432\""
							})
						}
					},
				});
			options.params = {
				group: "testcase",
				virtualNetworkName: "test-net",
				subnetName: "test-sn",
				addressPrefix: '10.0.0.0/24',
			};
			service.executeDriver('updateSubnet', options, function (error, response) {
				assert.ifError(error);
				assert.ok(response);
				assert.deepEqual(response, {
					"name": "test-sn",
					"id": "/subscriptions/d6/resourceGroups/testcase/providers/Microsoft.Network/virtualNetworks/test-net/subnets/test-sn",
					"addressPrefix": "10.0.0.0/24"
				});
				done();
			});
		});
	});
	
	describe("calling executeDriver - deleteSubnet", function () {
		afterEach((done) => {
			sinon.restore();
			done();
		});
		it("Success", function (done) {
			info = dD();
			options = info.deployCluster;
			sinon
				.stub(serviceUtils, 'authenticate')
				.yields(null, {
					credentials: {},
				});
			sinon
				.stub(serviceUtils, 'getConnector')
				.returns({
					subnets: {
						deleteMethod: (resourceGroupName, virtualNetworkName, subnetName, cb) => {
							return cb(null, true)
						}
					},
				});
			options.params = {
				group: "testcase",
				virtualNetworkName: "tester-vn",
				subnetName: "tester-sn",
			};
			service.executeDriver('deleteSubnet', options, function (error, response) {
				assert.ifError(error);
				assert.ok(response);
				done();
			});
		});
	});
});
