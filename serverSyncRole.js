const ShareDB = require('sharedb');
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const json = require('ot-json0');
const Role = require("./roleFramework/role");
const ServerSyncCompartment = require("./ServerSyncCompartment");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

ServerSyncRole = new Role("ServerSyncRole");
serverSyncCompartment = new ServerSyncCompartment();
serverSyncCompartment.addRole(ServerSyncRole);

ServerSyncRole.postPlayed = function () {

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
            docCounter.create({counter: 0});
        }
    });
    let doc = connection.get('json', 'tree');
    doc.fetch(function (err) {
        if (err) throw err;
        if (doc.type === null) {
            let dom = new JSDOM("<div id='root'>" + that.initDomString  + "</div>");
            let jsonObject = parseHtmlToJson(dom.window.document.getElementById("root"), docCounter);
            doc.create(jsonObject);
        }
    });
};

/**
 * @returns JSONObject
 */
parseHtmlToJson = function (element, docCounter) {
    let json = {};
    if (element.id == null || element.id === "") {
        element.id = docCounter.data.counter;
        docCounter.submitOp([{p: ['counter'], na: 1}])
    }
    let value = "";
    if (element.firstChild != null && element.firstChild.nodeValue != null) value = element.firstChild.nodeValue;
    json[element.id] = {
        'type': element.nodeName,
        'value': value,
        'children': [],
        'attributes': [{}]
    };
    if (element.className !== "") json[element.id]["attributes"][0]["class"] = element.className;
    if (element.className != null) {
        json[element.id]["attributes"][0]["class"] = element.className;
    }

    if (element.childNodes != null) {
        for (let i = 0; i < element.childNodes.length; i++) {
            let child = element.childNodes[i];
            if (child.nodeName === "#text") continue;
            json[element.id]["children"][i] = parseHtmlToJson(child, docCounter);
        }
    }
    return json;
};

module.exports = ServerSyncRole;