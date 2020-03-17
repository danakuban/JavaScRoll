var ReconnectingWebSocket = require('reconnecting-websocket');
var sharedb = require('sharedb/lib/client');
var json = require('ot-json0');

sharedb.types.register(json.type);

// Open WebSocket connection to ShareDB server
var socket = new ReconnectingWebSocket('ws://' + window.location.host);
var connection = new sharedb.Connection(socket);

window.disconnect = function () {
    connection.close();
};
window.connect = function () {
    var socket = new ReconnectingWebSocket('ws://' + window.location.host);
    connection.bindToSocket(socket);
};

let docCounter = connection.get('json', 'counter');
docCounter.subscribe();
// TODO: we need somehow an atomic operation for get and increment
increment = function() {
    docCounter.submitOp([{p:['counter'], na:1}])
};

const docJson = connection.get('json', 'tree');
docJson.subscribe(function (err) {
    if (err) throw err;
    window.document.getElementById('entryPoint').innerHTML = jsonToDom(docJson.data);
    addAddButtonListener();
    createCloseButtons();
    addCloseListener();
    addCheckedListener();

    MutationObserver = window.MutationObserver;

    const observer = new MutationObserver(function (mutations, observer) {
        // fired when a mutation occurs
        mutations.forEach(mutation => {
            console.log("mutation on target " + mutation.target.nodeName);
            let index;
            if (mutation.target === window.document.getElementById("entryPoint")) return; // updated by this code
            console.log(mutation);
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                console.log("node was added");
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
                    'children': []
                };
                if (addedNode.className !== "") newNode[addedNode.id]["class"] = addedNode.className;
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
                    index = path.reduce((o, n) => o[n], docJson.data).findIndex(function (item, i) {
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
                index = path.reduce((o, n) => o[n], docJson.data).findIndex(function (item, i) {
                    for (const prop in item) {
                        return prop === mutation.removedNodes[0].id
                    }
                });
                path.push(index);
                let op = {p: path, ld: path.reduce((o, n) => o[n], docJson.data)};
                docJson.submitOp(op);
            }
            if (mutation.type === "attributes" && mutation.attributeName === "class") {
                console.log("class attribute was added");
                let path = [getIndex(mutation.target), mutation.target.id];
                let node = mutation.target;
                while ((node = node.parentNode) && (node.id !== 'entryPoint')) {
                    path.unshift(node.id, "children");
                    if (node.id !== 'root') path.unshift(getIndex(node));
                }
                // TODO: add class instead of override
                path.push("class");
                let op = {p: path, oi:mutation.target.className};
                docJson.submitOp(op);
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
    console.log("received operation");
    window.document.getElementById('entryPoint').innerHTML = jsonToDom(docJson.data);
    addCheckedListener();
    addCloseListener();
});


/**
 * @returns {number}
 */
function getIndex(el) {
    var children = el.parentNode.childNodes,
        i = 0;
    for (; i < children.length; i++) {
        if (children[i] == el) {
            return i;
        }
    }
    return -1;
}

/**
 * @return {[]}
 */
function searchJsonForKey(json, key, path) {
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
}

/**
 * @return {string}
 */
function jsonToDom(json) {
    var xml = '';
    for (let id in json) {
        var type = json[id]["type"];
        xml = xml.concat("<", type, " id=\"", id.toString(), "\"");
        if (json[id].hasOwnProperty("class")) {
            xml = xml.concat(" class=\"", json[id]["class"], "\"");
        }
        xml = xml.concat(">");
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

/**
 * functionality of _todo list
 */
function createCloseButtons() {
    let nodes = document.getElementsByTagName("LI");
    for (let node of nodes) {
        if (node == null || node.tagName !== 'LI' || node.childNodes == null || (node.childNodes.length > 0 && node.childNodes[0].classList != null && node.childNodes[0].classList.contains("close"))) {
            continue;
        }
        const span = document.createElement("SPAN");
        const txt = document.createTextNode("\u00D7");
        span.className = "close";
        span.id = docCounter.data.counter;
        increment();
        span.appendChild(txt);
        node.appendChild(span);
        console.log("added close button");
    }
}

function addCloseListener() {
    let closes = document.getElementsByClassName("close");
    for (let close of closes) {
        close.onclick = function () {
            let parent = this.parentElement;
            parent.remove();
        }
    }
}

function addCheckedListener() {
    // Add a "checked" symbol when clicking on a list item
    var list = document.querySelector('ul');
    if (list == null) return;
    list.addEventListener('click', function (ev) {
        if (ev.target.tagName === 'LI') {
            ev.target.classList.toggle('checked');
        }
    }, false);
}

function addAddButtonListener() {
    let addButton = document.getElementById("add");
    addButton.addEventListener('click', function (ev) {
        const li = document.createElement("li");
        const inputValue = document.getElementById("myInput").value;
        const t = document.createTextNode(inputValue);
        li.appendChild(t);
        if (inputValue === '') {
            alert("You must write something!");
        } else {
            li.id = docCounter.data.counter;
            increment();
            document.getElementById("root").appendChild(li);
        }
        document.getElementById("myInput").value = "";
        createCloseButtons();
        addCloseListener();
        addCheckedListener();
    });
}