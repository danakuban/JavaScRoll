const expect = require("chai").expect;

const Player = require('../player.js');
const Role = require('../role.js');

console.log("start roleDeceptionTest");

const player = new Player();
const role = new Role("role");
const role2 = new Role("role2");
role2.returnOne = function() { return 1; };

player.plays(role);
role.plays(role2);
expect(player.returnOne()).to.equal(1);

console.log("finished roleDeceptionTest");