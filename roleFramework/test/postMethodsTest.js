const expect = require("chai").expect;

const Player = require("../player");
const Role = require("../role");

console.log("start postMethodTest");

let player = new Player();
let role = new Role("role");
role.postPlayed = function() {
    throw new Error("test post played");
}
role.postDropped = function() {
    throw new Error("test post dropped");
}

expect(function(){ player.plays(role) }).to.throw("test post played");
expect(function(){ player.drops(role) }).to.throw("test post dropped");

console.log("finished postMethodTest");