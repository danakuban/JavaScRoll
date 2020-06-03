const ReconnectingWebSocket = require('reconnecting-websocket');
const sharedb = require('sharedb/lib/client');
const json = require('ot-json0');

const ClientSyncCompartment = require('./clientSyncCompartment.js');
const Role = require('./roleFramework/role.js');

let ClientSyncRole = new Role("ClientSyncRole");
let clientSyncCompartment = new ClientSyncCompartment();
clientSyncCompartment.addRole(ClientSyncRole);
ClientSyncRole.postPlayed = function () {
    sharedb.types.register(json.type);

    // Open WebSocket connection to ShareDB server
    const socket = new ReconnectingWebSocket('ws://' + window.location.host);
    this.connection = new sharedb.Connection(socket);

    window.disconnect = function () {
        this.connection.close();
    };
    window.connect = function () {
        const socket = new ReconnectingWebSocket('ws://' + window.location.host);
        this.connection.bindToSocket(socket);
    };

    this.docCounter = this.connection.get('json', 'counter');
    this.docCounter.subscribe();

    this.docJson = this.connection.get('json', 'tree');
};

let ClientSyncRoleWrite = new Role("ClientSyncRoleWrite");
clientSyncCompartment.addRoleWithConstraint(ClientSyncRoleWrite);
ClientSyncRoleWrite.plays(ClientSyncRole);

ClientSyncRoleWrite.writeEnabled = function(){};
ClientSyncRoleWrite.observer = new MutationObserver(function (mutations) {
    let docCounter = ClientSyncRole.connection.get('json', 'counter');
    let docJson = ClientSyncRole.connection.get('json', 'tree');

    // fired when a mutation occurs
    mutations.forEach(mutation => {
        let op = getOperationFromMutation(mutation, docJson, docCounter, ClientSyncRoleWrite.entryPoint);
        if (op == null) return;
        docJson.submitOp(op);
    });
});

ClientSyncRoleWrite.postPlayed = function() {
    let that = this;
    this.docJson.subscribe(function (err) {
        if (err) throw err;
        window.document.getElementById(that.entryPoint).innerHTML = jsonToDom(that.docJson.data);
        try { that.update() } catch (err) { console.info("client has no update method"); }

        // we do these tries and catches because we cannot be sure that the client plays both roles (may be a constraint)
        try {
            that.player.getOfflineStack().forEach(op => that.docJson.submitOp(op));
        } catch (err) {
            console.log("offline stack role not played");
        }
        try {
            that.player.resetOfflineStack();
        } catch (err) {
            console.log("offline stack role not played");
        }

        // define what element should be observed by the observer
        // and what types of mutations trigger the callback
        that.observer.observe(document.getElementById(that.entryPoint), {
            subtree: true,
            attributes: true,
            characterData: true,
            childList: true
        });
    });
}

ClientSyncRoleWrite.postDropped = function() {
    this.observer.disconnect();
}

ClientSyncRoleWrite.moveListItemById = function (srcId, targetId) {
    let path = [];
    let node = document.getElementById(targetId);
    while ((node = node.parentNode) && (node.id !== 'entryPoint')) {
        path.unshift(node.id, "children");
        if (node.parentNode != null && node.parentNode.id !== this.entryPoint) path.unshift(getIndex(node));
    }
    let srcIndex = getIndex(document.getElementById(srcId));
    let targetIndex = getIndex(document.getElementById(targetId));
    path.push(srcIndex);
    const docJson = this.connection.get('json', 'tree');
    docJson.submitOp({p: path, lm: targetIndex});
};

let ClientSyncRoleRead = new Role("ClientSyncRoleRead");
clientSyncCompartment.addRoleWithConstraint(ClientSyncRoleRead);
ClientSyncRoleRead.plays(ClientSyncRole);
ClientSyncRoleRead.postPlayed = function() {
    let that = this;
    this.docJson.on('op', function () {
        window.document.getElementById('entryPoint').innerHTML = jsonToDom(that.docJson.data);
        try {
            that.update();
        } catch (error) {
            console.debug("caught error while updating: " + error.message);
        }
    });
}

let ClientSyncRoleOfflineStack = new Role("ClientSyncRoleOfflineStack");
clientSyncCompartment.addRole(ClientSyncRoleOfflineStack);
ClientSyncRoleOfflineStack.plays(ClientSyncRole);
ClientSyncRoleOfflineStack.offlineStack = [];
ClientSyncRoleOfflineStack.observer = new MutationObserver(function (mutations) {
    let docCounter = ClientSyncRole.connection.get('json', 'counter');
    let docJson = ClientSyncRole.connection.get('json', 'tree');

    // fired when a mutation occurs
    mutations.forEach(mutation => {
        let op = getOperationFromMutation(mutation, docJson, docCounter, ClientSyncRoleOfflineStack.entryPoint);
        if (op == null) return;
        ClientSyncRoleOfflineStack.offlineStack.push(op);
    });
});
ClientSyncRoleOfflineStack.getOfflineStack = function() { return this.offlineStack; };
ClientSyncRoleOfflineStack.resetOfflineStack = function() { ClientSyncRoleOfflineStack.offlineStack = []; };

ClientSyncRoleOfflineStack.postPlayed = function() {
    this.observer.observe(document.getElementById(this.entryPoint), {
        subtree: true,
        attributes: true,
        characterData: true,
        childList: true
    });
}

increment = function(docCounter) {
    // TODO: we need somehow an atomic operation for get and increment
    if (docCounter == null) {
        console.error("docCounter was not initialized");
        return;
    }
    docCounter.submitOp([{p: ['counter'], na: 1}])
}

/**
 * @returns {{}}
 */
getOperationFromMutation = function(mutation, docJson, docCounter, entryPoint) {
    if (mutation.target === window.document.getElementById(entryPoint)) return null; // updated by this code
    if (mutation.type === "attributes" && mutation.attributeName === "id") return null; //ids should get only updated by this app
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        console.log("node was added");
        const path = [];
        let addedNode = mutation.addedNodes[0];
        let node = addedNode;
        while ((node = node.parentNode) && (node.id !== entryPoint)) {
            path.unshift(node.id, "children");
            if (node.parentNode != null && node.parentNode.id !== entryPoint) {
                path.unshift(getIndex(node));
            }
        }
        const newNode = {};
        let id = docCounter.data.counter;
        increment(docCounter);
        newNode[id] = {
            'type': addedNode.nodeName,
            'value': addedNode.firstChild.nodeValue,
            'children': [],
            'attributes': [{}]
        };
        for (let attribute in addedNode.getAttributeNames()) {
            if (addedNode.getAttributeNode(attribute) == null) continue;
            newNode[id]["attributes"][0][attribute] = addedNode.getAttributeNode(attribute).value;
        }
        if (addedNode.className != null) {
            newNode[id]["attributes"][0]["class"] = addedNode.className;
        }
        if (addedNode.nextElementSibling != null) {
            let index = path.reduce((o, n) => o[n], docJson.data).findIndex(function (item) {
                for (const prop in item) {
                    return prop === addedNode.nextElementSibling.id
                }
            });
            path.push(index);
            return {p: path, "li": newNode};
        } else if (addedNode.previousElementSibling != null) {
            let index = path.reduce((o, n) => o[n], docJson.data).findIndex(function (item) {
                for (const prop in item) {
                    return prop === addedNode.previousElementSibling.id
                }
            });
            index++;
            path.push(index);
            return {p: path, "li": newNode};
        } else {
            // no sibling node
            return {p: path, "od": [], "oi": [newNode]};
        }
    }
    if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
        // otherwise the node is only a document fragment and we cannot access the parent node
        console.log("node was removed");
        const path = searchJsonForKey(docJson.data, mutation.removedNodes[0].id, []);
        return {p: path, ld: path.reduce((o, n) => o[n], docJson.data)};
    }
    if (mutation.type === "attributes") {
        console.log("attribute was added");
        let path = [getIndex(mutation.target), mutation.target.id];
        let node = mutation.target;
        while ((node = node.parentNode) && (node.id !== entryPoint)) {
            path.unshift(node.id, "children");
            if (node.parentNode != null && node.parentNode.id !== entryPoint) path.unshift(getIndex(node));
        }
        //TODO: create object if not present
        path.push("attributes");
        path.push(0);
        let attributes = path.reduce((o, n) => o[n], docJson.data);
        let attributeName = mutation.attributeName;
        let attributeValue = mutation.target.getAttribute(attributeName);
        if (attributes.hasOwnProperty(attributeName) && attributes[attributeName] === attributeValue) {
            return null;
        }
        // todo: attribute might change
        path.push(attributeName);
        return {p: path, oi: attributeValue};
    }
}

/**
 * @returns {number}
 */
getIndex = function (el) {
    let children = el.parentNode.childNodes;
    for (let i = 0; i < children.length; i++) {
        if (children[i] === el) {
            return i;
        }
    }
    return -1;
};

/**
 * @return {[]}
 */
searchJsonForKey = function (json, key, path) {
    if (json.hasOwnProperty(key)) {
        return path;
    } else {
        for (let prop in json) {
            path.push(prop, "children");
            json = json[prop];
        }
        for (let i = 0; i < json["children"].length; i++) {
            let newPath = path.slice();
            newPath.push(i);
            const result = searchJsonForKey(json["children"][i], key, newPath);
            if (result != null) {
                return result;
            }
        }
    }
};

/**
 * @return {string}
 */
jsonToDom = function (json) {
    let xml = '';
    for (let id in json) {
        const type = json[id]["type"];
        xml = xml.concat("<", type, " id=\"", id.toString(), "\"");
        if (json[id].hasOwnProperty("attributes") && json[id]["attributes"].length > 0) {
            let attributes = json[id]["attributes"][0];
            Object.keys(attributes).forEach(function (key) {
                if (attributes[key] === "") return;
                xml = xml.concat(" ", key, "=\"", attributes[key], "\"");
            });
        }
        xml = xml.concat(">");
        if (json[id].hasOwnProperty("children")) {
            for (let i = 0; i < json[id]["children"].length; i++) {
                xml = xml.concat(jsonToDom(json[id]["children"][i]));
            }
        }
        if (json[id].hasOwnProperty("value")) {
            xml = xml.concat(json[id]["value"])
        }
        xml = xml.concat("</", type, ">");
    }

    return xml;
};

module.exports = {
    ClientSyncRole,
    ClientSyncRoleRead,
    ClientSyncRoleWrite,
    ClientSyncRoleOfflineStack
};