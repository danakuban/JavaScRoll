const http = require('http');
const express = require('express');
const DOMParser = require('dom-parser');
const fs = require('fs');

const Player = require('./roleFramework/player.js');
const ServerSyncRole = require('./serverSyncRole.js');

const server = new Player();
server.startServer = function() {
    console.log("start server");
    // Create a web server to serve files and listen to WebSocket connections
    let app = express();
    app.use(express.static('static'));
    let server = http.createServer(app);
    server.listen(8080);
    console.log('Listening on http://localhost:8080');
    return server;
};

server.plays(ServerSyncRole);
server.startSync();
