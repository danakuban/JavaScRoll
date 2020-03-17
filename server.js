var http = require('http');
var express = require('express');
var ShareDB = require('sharedb');
var WebSocket = require('ws');
var json = require('ot-json1');
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');

ShareDB.types.register(json.type);
var backend = new ShareDB();
ShareDB.logger.setMethods({
    debug: () => console.log(arguments),
    trace: () => console.log(arguments),
    info: () => console.log(arguments),
    warn: () => console.warn(arguments),
    error: () => console.error(arguments)
});
// Create initial document then fire callback
createDoc(startServer);

function createDoc(callback) {
    var connection = backend.connect();
    var docCounter = connection.get('json', 'counter');
    docCounter.fetch(function(err) {
        if (err) throw err;
        if (docCounter.type === null) {
            docCounter.create({counter: 7});
        }
    });
    var doc = connection.get('json', 'tree');
    doc.fetch(function(err) {
        if (err) throw err;
        if (doc.type === null) {
            doc.create({root: {type: 'ul', children: [
                        {1: {type: 'li', children: [{4: {type: 'span', children: [], class: 'close', value:'x'}}], value: 'drink water'}},
                        {2: {type: 'li', value: 'do sports', children: [{5: {type: 'span', children: [], class: 'close', value:'x'}}]}},
                        {3: {type: 'li', value: 'do DA', children: [{6: {type: 'span', children: [], class: 'close', value:'x'}}]}}
                    ]}}, callback);
            return;
        }
        callback();
    });
}

function startServer() {
    // Create a web server to serve files and listen to WebSocket connections
    var app = express();
    app.use(express.static('static'));
    var server = http.createServer(app);

    // Connect any incoming WebSocket connection to ShareDB
    var wss = new WebSocket.Server({server: server});
    wss.on('connection', function(ws) {
        var stream = new WebSocketJSONStream(ws);
        backend.listen(stream);
    });

    server.listen(8080);
    console.log('Listening on http://localhost:8080');
}