'use strict';

module.exports = {
    "apiVersion": "extensions/v1beta1",
    "kind": "Deployment",
    "metadata": {
        "name": "",
        "labels": ""
    },
    "spec": {
        "replicas": 0,
        "selector": {
            "matchLabels": ""
        },
        "template": {
            "metadata": {
                "name": "",
                "labels": {}
            },
            "spec": {
            	"revisionHistoryLimit": "2",
                "containers": [
                    {
                        "name": "",
                        "image": "",
                        "imagePullPolicy": "",
                        "workingDir": "",
                        "command": [],
                        "args": [],
                        "ports": [],
                        "env": [],
                        "volumeMounts": []
                    }
                ],
                "volumes": []
            }
        }
    }
};
