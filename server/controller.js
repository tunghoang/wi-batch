let genWorkflow = require('./function/gen-workflow');
let runWorkflow = require('./function/run-workflow');
let fs = require('fs');
let path = require('path');
let utils = require('./utils');
let responseJSON = require('./response');

// class Response {
//     constructor(code, reason, content) {
//         this.code = code;
//         this.reason = reason;
//         this.content = content;
//     }
// }

let generateNewWorkflow = function (data, callback, username) {
    if (!fs.existsSync(path.join(__dirname, '../', 'workflows', username))) {
        fs.mkdirSync(path.join(__dirname, '../', 'workflows', username));
    }
    if (!data.workflowName) return callback(responseJSON(512, "NEED WORKFLOW NAME", {}));
    let myConfig = {
        host: data.host,
        port: data.port,
        path: data.path,
        username: data.username,
        password: data.password
    }
    genWorkflow(myConfig, data.workflowName, data.dataDir, function (err, file) {
        if (err) {
            callback(responseJSON(400, err, {}));
        } else {
            let response = {};
            response.filesList = fs.readFileSync(file).toString().split("\n");
            response.info = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'workflows', username, data.workflowName, 'workflow.json')).toString());
            response.filesList.splice(response.filesList.length - 1, 1);
            callback(responseJSON(200, "Successfull", response));
        }
    }, username);
};

let runAWorkflow = function (data, callback, username) {
    let workflowName = data.workflowName;
    let workflowConfig = null;
    try {
        workflowConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'workflows', username, workflowName, 'workflow.json')).toString());
        workflowConfig.workflowDir = path.join(__dirname, '../', 'workflows', username, workflowName);
        workflowConfig.socket = data.socket;
    } catch (err) {
        return callback(responseJSON(512, "NO_WORKFLOW_FOUND", {}));
    }
    runWorkflow.doLogin(workflowConfig.username, workflowConfig.password, function (err, result) {
        if (err) {
            //login failed
            callback(responseJSON(401, err, {}));
        } else {
            //login successful
            workflowConfig.token = result;
            runWorkflow.uploadMultiFiles(workflowConfig, function () {

            });
            callback(responseJSON(200, "Successfull", workflowConfig));
        }
    });
};

let listWorkflow = function (data, callback, username) {
    if (!fs.existsSync(path.join(__dirname, '../', 'workflows', username))) {
        fs.mkdirSync(path.join(__dirname, '../', 'workflows', username));
    }
    let workflwoFolder = path.join(__dirname, '../', 'workflows', username);
    let files = [];
    fs.readdirSync(workflwoFolder).forEach(file => {
        if (file != 'readme.txt') {
            let info = {};
            info.workflowName = file;
            info.worflowConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'workflows', username, file, 'workflow.json')).toString());
            files.push(info);
        }
    });
    callback(responseJSON(200, "Successfull", files));
};

let listDataDir = function (data, callback, username) {
    if (!fs.existsSync(path.join(__dirname, '../', 'dataDir', username))) {
        fs.mkdirSync(path.join(__dirname, '../', 'dataDir', username));
    }
    let dataDirFolder = path.join(__dirname, '../', 'dataDir', username);
    let files = [];
    fs.readdirSync(dataDirFolder).forEach(file => {
        if (file != 'readme.txt') {
            files.push(file);
        }
    });
    callback(responseJSON(200, "Successfull", files));
}

let deleteWorkflow = function (payload, callback, username) {
    if (payload.workflowName) {
        let deletePath = path.join(__dirname, '../', 'workflows', username, payload.workflowName);
        utils.deleteFolder(deletePath);
        callback(responseJSON(200, "Successfull", payload.workflowName));
    } else {
        callback(responseJSON(500, "No workflow name", {}));
    }
};

module.exports = {
    generateNewWorkflow: generateNewWorkflow,
    runAWorkflow: runAWorkflow,
    listWorkflow: listWorkflow,
    deleteWorkflow: deleteWorkflow,
    listDataDir: listDataDir
};