'use strict';

module.exports = {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
        "labels": {
            "task": "monitoring",
            "kubernetes.io/cluster-service": "true",
            "kubernetes.io/name": "Heapster"
        },
        "name": "heapster",
        "namespace": "kube-system"
    },
    "spec": {
        "selector": {
            "k8s-app": "heapster"
        },
        "ports": [
            {
                "port": 80,
                "targetPort": 8082
            }
        ]
    }
}