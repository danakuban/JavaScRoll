const ReconnectingWebSocket = require('reconnecting-websocket');
const sharedb = require('sharedb/lib/client');
const json = require('ot-json0');

const Role = require('./roleFramework/role.js');

ClientSyncRole = new Role("ClientSyncRole");
// TODO: do we need a possibility to run some code in the moment the role is assigned to a player?
ClientSyncRole.connect = function () {
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

    let docCounter = this.connection.get('json', 'counter');
    docCounter.subscribe();
    // TODO: we need somehow an atomic operation for get and increment
    this.increment = function () {
        docCounter.submitOp([{p: ['counter'], na: 1}])
    };

    const docJson = this.connection.get('json', 'tree');
    var that = this;
    docJson.subscribe(function (err) {
        if (err) throw err;
        window.document.getElementById('entryPoint').innerHTML = jsonToDom(docJson.data);
        that.update();

        MutationObserver = window.MutationObserver;

        const observer = new MutationObserver(function (mutations) {
            // fired when a mutation occurs
            mutations.forEach(mutation => {
                console.trace("mutation on target " + mutation.target.nodeName);
                let index;
                if (mutation.target === window.document.getElementById("entryPoint")) return; // updated by this code
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    console.trace("node was added");
                    const path = [];
                    let addedNode = mutation.addedNodes[0];
                    let node = addedNode;
                    while ((node = node.parentNode) && (node.id !== 'entryPoint')) {
                        path.unshift(node.id, "children");
                        if (node.id !== 'root') path.unshift(getIndex(node));
                    }
                    const newNode = {};
                    newNode[addedNode.id] = {
                        'type': addedNode.nodeName,
                        'value': addedNode.firstChild.nodeValue,
                        'children': [],
                        'attributes': [{}]
                    };
                    for (let attribute in addedNode.attributes) {
                        newNode[addedNode.id]["attributes"][0][attribute] = addedNode.attributes[attribute];
                    }
                    if (addedNode.nextElementSibling != null) {
                        console.trace("there is a next sibling");
                        index = path.reduce((o, n) => o[n], docJson.data).findIndex(function (item) {
                            for (const prop in item) {
                                return prop === addedNode.nextElementSibling.id
                            }
                        });
                        path.push(index);
                        docJson.submitOp({p: path, "li": newNode});
                    } else if (addedNode.previousElementSibling != null) {
                        console.trace("there is a previous sibling");
                        index = path.reduce((o, n) => o[n], docJson.data).findIndex(function (item) {
                            for (const prop in item) {
                                return prop === addedNode.previousElementSibling.id
                            }
                        });
                        index++;
                        path.push(index);
                        docJson.submitOp({p: path, "li": newNode});
                    } else {
                        console.trace("there is no sibling");
                        const op = {p: path, "od": [], "oi": [newNode]};
                        docJson.submitOp(op);
                    }
                    // <div id="4">hello</div>
                }
                if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
                    // otherwise the node is only a document fragment and we cannot access the parent node
                    console.trace("node was removed");
                    const path = searchJsonForKey(docJson.data, mutation.removedNodes[0].id, []);
                    index = path.reduce((o, n) => o[n], docJson.data).findIndex(function (item) {
                        for (const prop in item) {
                            return prop === mutation.removedNodes[0].id
                        }
                    });
                    path.push(index);
                    let op = {p: path, ld: path.reduce((o, n) => o[n], docJson.data)};
                    docJson.submitOp(op);
                }
                if (mutation.type === "attributes") {
                    let path = [getIndex(mutation.target), mutation.target.id];
                    let node = mutation.target;
                    while ((node = node.parentNode) && (node.id !== 'entryPoint')) {
                        path.unshift(node.id, "children");
                        if (node.id !== 'root') path.unshift(getIndex(node));
                    }
                    //TODO: create object if not present
                    path.push("attributes");
                    path.push(0);
                    let attributes = path.reduce((o, n) => o[n], docJson.data);
                    let attributeName = mutation.attributeName;
                    let attributeValue = mutation.target.getAttribute(attributeName);
                    if (attributes.hasOwnProperty(attributeName) && attributes[attributeName] === attributeValue) {
                        console.trace("node has correct attribute");
                        return;
                    }
                    // todo: attribute might change
                    path.push(attributeName);
                    let op = {p: path, oi: attributeValue};
                    docJson.submitOp(op);
                    console.log(docJson.data);
                }
            });
        });

        // define what element should be observed by the observer
        // and what types of mutations trigger the callback
        observer.observe(document.getElementById("entryPoint"), {
            subtree: true,
            attributes: true,
            characterData: true,
            childList: true
        });
    });

    docJson.on('op', function () {
        console.trace("received operation");
        window.document.getElementById('entryPoint').innerHTML = jsonToDom(docJson.data);
        try {
            that.update();
        } catch (error) {
            console.debug("caught error while updating: " + error.message);
        }
    });
};

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
            const result = searchJsonForKey(json["children"][i], key, path.slice());
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

ClientSyncRole.moveListItemById = function (srcId, targetId) {
    let path = [];
    let node = document.getElementById(targetId);
    while ((node = node.parentNode) && (node.id !== 'entryPoint')) {
        path.unshift(node.id, "children");
        if (node.id !== 'root') path.unshift(getIndex(node));
    }
    let srcIndex = getIndex(document.getElementById(srcId));
    let targetIndex = getIndex(document.getElementById(targetId));
    path.push(srcIndex);
    const docJson = this.connection.get('json', 'tree');
    docJson.submitOp({p: path, lm: targetIndex});
};

module.exports = ClientSyncRole;