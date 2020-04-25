const expect = require("chai").expect;

const Player = require("../player");
const Role = require("../role");

console.log("start doubleRolePlayingTest");

let player = new Player();
let role = new Role("role");
let role2 = new Role("role2");

player.plays(role);
expect(function() { player.plays(role) }).to.throw("player plays this role already");
role.plays(role2);
expect(function() { player.plays(role2) }).to.throw("player plays this role already");

console.log("finished doubleRolePlayingTest");