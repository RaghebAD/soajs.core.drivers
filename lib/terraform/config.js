'use strict';

module.exports = {

    terraform: {
        applyCommand: 'terraform init && sleep 1 && terraform apply -auto-approve',
        destroyCommand: 'terraform init && sleep 1 && terraform destroy -auto-approve',
        stateFileName: 'terraform.tfstate',
        templateDefaultName: 'main.tf',
        tempFolderPrefix: 'terraform-'
    }

};