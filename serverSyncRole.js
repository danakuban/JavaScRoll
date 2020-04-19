const ShareDB = require('sharedb');
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const json = require('ot-json1');
const Role = require("./roleFramework/role");
const ServerSyncCompartment = require("./ServerSyncCompartment");

ServerSyncRole = new Role("ServerSyncRole");
serverSyncCompartment = new ServerSyncCompartment();
serverSyncCompartment.addRole(ServerSyncRole);

ServerSyncRole.startSync = function () {

    ShareDB.types.register(json.type);
    this.backend = new ShareDB();

    // Create initial document then fire callback
    let server = this.startServer(); // provided by player

    // Connect any incoming WebSocket connection to ShareDB
    let wss = new WebSocket.Server({server: server});
    var that = this;
    wss.on('connection', function (ws) {
        var stream = new WebSocketJSONStream(ws);
        that.backend.listen(stream);
    });

    let connection = this.backend.connect();
    let docCounter = connection.get('json', 'counter');
    docCounter.fetch(function (err) {
        if (err) throw err;
        if (docCounter.type === null) {
            docCounter.create({counter: 7});
        }
    });
    let doc = connection.get('json', 'tree');
    doc.fetch(function (err) {
        if (err) throw err;
        if (doc.type === null) {
            doc.create({
                root: {
                    type: 'ul', children: [
                        {
                            1: {
                                type: 'li',
                                attributes: [{draggable: 'true'}],
                                children: [{
                                    4: {
                                        type: 'span',
                                        children: [],
                                        attributes: [{class: 'close'}],
                                        value: 'x'
                                    }
                                }],
                                value: 'drink water'
                            }
                        },
                        {
                            2: {
                                type: 'li',
                                attributes: [{draggable: 'true'}],
                                value: 'do sports',
                                children: [{
                                    5: {
                                        type: 'span',
                                        children: [],
                                        attributes: [{class: 'close'}],
                                        value: 'x'
                                    }
                                }]
                            }
                        },
                        {
                            3: {
                                type: 'li',
                                attributes: [{draggable: 'true', class: 'checked'}],
                                value: 'do DA',
                                children: [{
                                    6: {
                                        type: 'span',
                                        children: [],
                                        attributes: [{class: 'close'}],
                                        value: 'x'
                                    }
                                }]
                            }
                        }
                    ]
                }
            });
        }
    });
};

/**
 * @returns JSONObject
 */
parseHtmlToJson = function (element, json) {
    console.log(element);
    json[element.id] = {
        'type': element.nodeName,
        'value': element.firstChild.nodeValue,
        'children': [],
        'attributes': [{}]
    };
    if (element.className !== "") json[element.id]["attributes"][0]["class"] = element.className;
    for (let attribute in element.attributes) {
        json[element.id]["attributes"][0][attribute] = element.attributes[attribute];
    }
    for (let i = 0; i < element.childNodes.length; i++) {
        let child = element.childNodes[i];
        json[element.id]["children"][i] = parseHtmlToJson(child);
    }
    return json;
};

module.exports = ServerSyncRole;