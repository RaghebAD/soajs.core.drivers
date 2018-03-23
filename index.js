/*jshint esversion: 6 */

/*
 * Core drivers use dockerode and kubernetes-client npm modules to communicate with the docker and kubernetes APIs
 *      - dockerode: https://www.npmjs.com/package/dockerode
 *      - kubernetes-client: https://www.npmjs.com/package/kubernetes-client
 */


"use strict";

let fs = require('fs');
let cache = {};
let errorFile = require('./utils/errors.js');
const utils = require('./utils/utils.js');

function checkIfSupported(options, cb, fcb) {
    let isSupported = ((options.strategy[options.function] && typeof (options.strategy[options.function]) === 'function') ? true : false);

    if (isSupported) return fcb();
    else return cb({
        "source": "driver",
        "error": "error",
        "code": 519,
        "msg": errorFile[519]
    });
}

function getStrategy(options, cb) {
    checkCache(options, (error, strategy) => {
        if (strategy) return cb(null, strategy);

        let path = __dirname + "/strategies/" + options.strategy + ".js";

        checkStrategy(path, (error) => {
            if (error) return cb(error);

            try {
                cache[options.strategy] = require(path);
            }
            catch (e) {
                console.log("Error");
                console.log(e);
                return cb(e);
            }

            return cb(null, cache[options.strategy]);
        });
    });

    function checkCache(options, cb) {
        if (cache[options.strategy]) {
            return cb(null, cache[options.strategy]);
        }

        return cb();
    }

    function checkStrategy(path, cb) {
        fs.access(path, fs.constants.F_OK | fs.constants.R_OK, cb);
    }
}

module.exports = {

    /**
     * Inspect cluster
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    inspectCluster (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'inspectCluster'}, cb, () => {
                    strategy.inspectCluster(options, cb);
                });
            });
        });
    },

    /**
     * Adds a node to a cluster
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    addNode (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'addNode'}, cb, () => {
                    strategy.addNode(options, cb);
                });
            });
        });
    },

    /**
     * Removes a node from a cluster
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    removeNode (options, cb) { //options should include backgroundCB
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'removeNode'}, cb, () => {
                    strategy.removeNode(options, cb);
                });
            });
        });
    },

    /**
     * Updates a node's role or availability
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    updateNode (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'updateNode'}, cb, () => {
                    strategy.updateNode(options, cb);
                });
            });
        });
    },

    /**
     * Inspect a node, strategy in this case is restricted to swarm
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    inspectNode (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'inspectNode'}, cb, () => {
                    strategy.inspectNode(options, cb);
                });
            });
        });
    },

    /**
     * List nodes in a cluster
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    listNodes (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'listNodes'}, cb, () => {
                    strategy.listNodes(options, cb);
                });
            });
        });
    },

    /**
     * Create a new namespace (kubernetes only)
     * @param options
     * @param cb
     */
    createNameSpace (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'createNameSpace'}, cb, () => {
                    strategy.createNameSpace(options, cb);
                });
            });
        });
    },

    /**
     * List all namespaces (kubernetes only)
     * @param options
     * @param cb
     */
    listNameSpaces (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'listNameSpaces'}, cb, () => {
                    strategy.listNameSpaces(options, cb);
                });
            });
        });
    },

    /**
     * Delete a namespace (kubernetes only)
     * @param options
     * @param cb
     */
    deleteNameSpace (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'deleteNameSpace'}, cb, () => {
                    strategy.deleteNameSpace(options, cb);
                });
            });
        });
    },


    /**
     * List services/deployments currently available
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    listServices (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'listServices'}, cb, () => {
                    strategy.listServices(options, cb);
                });
            });
        });
    },

    /**
     * Creates a new deployment for a SOAJS scaleHAService
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    deployService (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'deployService'}, cb, () => {
                    strategy.deployService(options, cb);
                });
            });
        });
    },

    /**
     * Redeploy a service/deployment (sync)
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    redeployService (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'redeployService'}, cb, () => {
                    strategy.redeployService(options, cb);
                });
            });
        });
    },

    /**
     * Scales a deployed services up/down depending on current replica count and new one
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    scaleService (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'scaleService'}, cb, () => {
                    strategy.scaleService(options, cb);
                });
            });
        });
    },

    /**
     * Gathers and returns information about specified service and a list of its tasks/pods
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    inspectService (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'inspectService'}, cb, () => {
                    strategy.inspectService(options, cb);
                });
            });
        });
    },

    /**
     * Takes environment code and
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    findService (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'findService'}, cb, () => {
                    strategy.findService(options, cb);
                });
            });
        });
    },

    /**
     * Inspects and returns information about a specified task/pod
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    inspectTask (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'inspectTask'}, cb, () => {
                    strategy.inspectTask(options, cb);
                });
            });
        });
    },

    /**
     * Deletes a deployed service
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    deleteService (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'deleteService'}, cb, () => {
                    strategy.deleteService(options, cb);
                });
            });
        });
    },

    /**
     * Collects and returns a container logs based on a pre-defined 'tail' value
     *
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    getContainerLogs (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'getContainerLogs'}, cb, () => {
                    strategy.getContainerLogs(options, cb);
                });
            });
        });
    },

    /**
    * Perform a SOAJS maintenance operation on a given service
    *
    * @param {Object} options
    * @param {Function} cb
    * @returns {*}
    */
    maintenance (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'maintenance'}, cb, () => {
                    strategy.maintenance(options, cb);
                });
            });
        });
    },

    /**
    * List kubernetes services, return raw response
    *
    * @param {Object} options
    * @param {Function} cb
    * @returns {*}
    */
    listKubeServices (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'listKubeServices'}, cb, () => {
                    strategy.listKubeServices(options, cb);
                });
            });
        });
    },

    /**
     * Get an autoscaler for a given deployment
     * @param  {Object}   options
     * @param  {Function} cb
     *
     */
    getAutoscaler (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'getAutoscaler'}, cb, () => {
                    strategy.getAutoscaler(options, cb);
                });
            });
        });
    },

    /**
     * Create an autoscaler for a given deployment
     * @param  {Object}   options
     * @param  {Function} cb
     *
     */
    createAutoscaler (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'createAutoscaler'}, cb, () => {
                    strategy.createAutoscaler(options, cb);
                });
            });
        });
    },

    /**
     * Update an autoscaler for a given deployment
     * @param  {Object}   options
     * @param  {Function} cb
     *
     */
    updateAutoscaler (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'updateAutoscaler'}, cb, () => {
                    strategy.updateAutoscaler(options, cb);
                });
            });
        });
    },

    /**
     * Delete an autoscaler for a given deployment
     * @param  {Object}   options
     * @param  {Function} cb
     *
     */
    deleteAutoscaler (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'deleteAutoscaler'}, cb, () => {
                    strategy.deleteAutoscaler(options, cb);
                });
            });
        });
    },

    /**
     * Create any type of kubernetes resource
     * @param  {Object}   options
     * @param  {Function} cb
     *
     */
    manageResources (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'manageResources'}, cb, () => {
                    strategy.manageResources(options, cb);
                });
            });
        });
    },

    /**
     * Get the latest version of a deployed service
     * Returns integer: service version
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    getLatestVersion (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'getLatestVersion'}, cb, () => {
                    strategy.getLatestVersion(options, cb);
                });
            });
        });
    },

    /**
     * Get the domain/host name of a deployed service (per version)
     * Sample response: {"1":"DOMAIN","2":"DOMAIN"}
     * @param {Object} options
     * @param {Function} cb
     * @returns {*}
     */
    getServiceHost (options, cb) {
        getStrategy(options, (error, strategy) => {
            utils.checkError(error, 518, cb, () => {
                checkIfSupported({strategy: strategy, function: 'getServiceHost'}, cb, () => {
                    strategy.getServiceHost(options, cb);
                });
            });
        });
    },

	/**
	 * Get Services Metrics
	 * @param {Object} options
	 * @param {Function} cb
	 * @returns {*}
	 */
	getServicesMetrics (options, cb) {
		getStrategy(options, (error, strategy) => {
			utils.checkError(error, 518, cb, () => {
				checkIfSupported({strategy: strategy, function: 'getServicesMetrics'}, cb, () => {
					strategy.getServicesMetrics(options, cb);
				});
			});
		});
	},

	/**
	 * Get Nodes Metrics
	 * @param {Object} options
	 * @param {Function} cb
	 * @returns {*}
	 */
	getNodesMetrics (options, cb) {
		getStrategy(options, (error, strategy) => {
			utils.checkError(error, 518, cb, () => {
				checkIfSupported({strategy: strategy, function: 'getNodesMetrics'}, cb, () => {
					strategy.getNodesMetrics(options, cb);
				});
			});
		});
	},

	/**
	 * Create Secret
	 * @param {Object} options
	 * @param {Function} cb
	 * @returns {*}
	 */
	createSecret (options, cb) {
		getStrategy(options, (error, strategy) => {
			utils.checkError(error, 518, cb, () => {
				checkIfSupported({strategy: strategy, function: 'createSecret'}, cb, () => {
					strategy.createSecret(options, cb);
				});
			});
		});
	},

	/**
	 * Delete Secret
	 * @param {Object} options
	 * @param {Function} cb
	 * @returns {*}
	 */
	deleteSecret (options, cb) {
		getStrategy(options, (error, strategy) => {
			utils.checkError(error, 518, cb, () => {
				checkIfSupported({strategy: strategy, function: 'deleteSecret'}, cb, () => {
					strategy.deleteSecret(options, cb);
				});
			});
		});
	},

	/**
	 * List Secrets
	 * @param {Object} options
	 * @param {Function} cb
	 * @returns {*}
	 */
	listSecrets (options, cb) {
		getStrategy(options, (error, strategy) => {
			utils.checkError(error, 518, cb, () => {
				checkIfSupported({strategy: strategy, function: 'listSecrets'}, cb, () => {
					strategy.listSecrets(options, cb);
				});
			});
		});
	},

	/**
	 * Get one Secret
	 * @param {Object} options
	 * @param {Function} cb
	 * @returns {*}
	 */
	getSecret (options, cb) {
		getStrategy(options, (error, strategy) => {
			utils.checkError(error, 518, cb, () => {
				checkIfSupported({strategy: strategy, function: 'getSecret'}, cb, () => {
					strategy.getSecret(options, cb);
				});
			});
		});
	}
};
