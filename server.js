const http = require('http');
const express = require('express');
const DOMParser = require('dom-parser');
const fs = require('fs');

const Player = require('./roleFramework/player.js');
const ServerSyncRole = require('./serverSyncRole.js');

class Server extends Player {
    constructor() {
        super();
    }

    startServer() {
        console.log("start server");
        // Create a web server to serve files and listen to WebSocket connections
        let app = express();
        app.use(express.static('static'));
        let server = http.createServer(app);
        server.listen(8080);
        console.log('Listening on http://localhost:8080');
        return server;
    }
}

const server = new Server();
const syncRole = new ServerSyncRole();
server.plays(syncRole); //TODO: Constraint: has method startServer()
server.startSync();
