var ReconnectingWebSocket = require('reconnecting-websocket');
var sharedb = require('sharedb/lib/client');
var json = require('ot-json0');

sharedb.types.register(json.type);

// Open WebSocket connection to ShareDB server
var socket = new ReconnectingWebSocket('ws://' + window.location.host);
var connection = new sharedb.Connection(socket);

window.disconnect = function() {
    connection.close();
};// TODO: todo liste
window.connect = function() {
    var socket = new ReconnectingWebSocket('ws://' + window.location.host);
    connection.bindToSocket(socket);
};

const docJson = connection.get('tree', 'json');
docJson.subscribe(function(err) {
    if (err) throw err;
    window.document.getElementById('root').innerHTML = jsonToDom(docJson.data);

    docJson.on('op', function() {
        window.document.getElementById('root').innerHTML = jsonToDom(docJson.data);
    });

    MutationObserver = window.MutationObserver;

    const observer = new MutationObserver(function (mutations, observer) {
        // fired when a mutation occurs
        mutations.forEach(mutation => {
            let index;
            if (mutation.target === window.document.getElementById("root")) return; // updated by this code
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                console.log("node was added");
                const path = [];
                let addedNode = mutation.addedNodes[0];
                let node = addedNode;
                while ((node = node.parentNode) && (node.id.toLowerCase() !== 'root')) {
                    path.unshift(node.id, "children");
                }
                const newNode = {};
                newNode[addedNode.id] = {'type': addedNode.nodeName, 'value': addedNode.firstChild.nodeValue, 'children': []};
                if (addedNode.nextElementSibling != null) {
                    console.log("there is a next sibling");
                    index = path.reduce((o, n) => o[n], docJson.data).findIndex(function (item, i) {
                        for (const prop in item) {
                            return prop === addedNode.nextElementSibling.id
                        }
                    });
                    path.push(index);
                    docJson.submitOp({p: path, "li": newNode});
                } else if (addedNode.previousElementSibling != null) {
                    console.log("there is a previous sibling");
                    index = path.reduce((o, n) => o[n], docJson.data).findIndex(function(item, i){
                        for (const prop in item) {
                            return prop === addedNode.previousElementSibling.id
                        }
                    });
                    index++;
                    path.push(index);
                    docJson.submitOp({p: path, "li": newNode});
                } else {
                    console.log("there is no sibling");
                    const op = {p: path, "od": [], "oi": [newNode]};
                    docJson.submitOp(op);
                }
                // <div id="4">hello</div>
            }
            if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
                // otherwise the node is only a document fragment and we cannot access the parent node
                console.log("node was removed");
                const path = searchJsonForKey(docJson.data, mutation.removedNodes[0].id, []);
                index = path.reduce((o, n) => o[n], docJson.data).findIndex(function(item, i){
                    for (const prop in item) {
                        return prop === mutation.removedNodes[0].id
                    }
                });
                path.push(index);
                let op = {p: path, ld: path.reduce((o, n) => o[n], docJson.data)};
                docJson.submitOp(op);
            }
        });
    });

    // define what element should be observed by the observer
    // and what types of mutations trigger the callback
    observer.observe(document.getElementById("root"), {
        subtree: true,
        attributes: true,
        characterData: true,
        childList: true
    });
});

/**
 * @return {[]}
 */
function searchJsonForKey(json, key, path) {
    if (json.hasOwnProperty(key)) {
        return path;
    } else {
        for(let prop in json) {
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
}

/**
 * @return {string}
 */
function jsonToDom(json) {
    var xml = '';
    for( let id in json ){
        var type = json[id]["type"];
        xml = xml.concat("<", type, " id=\"", id.toString(), "\">");
        if (json[id].hasOwnProperty("children")) {
            for (var i = 0; i < json[id]["children"].length; i++) {
                xml = xml.concat(jsonToDom(json[id]["children"][i]));
            }
        }
        if (json[id].hasOwnProperty("value")) {
            xml = xml.concat(json[id]["value"])
        }
        xml = xml.concat("</", type, ">");
    }
    return xml;
}