const expect = require("chai").expect;

const Player = require('../player.js');
const Role = require('../role.js');

console.log("start roleMethodDelegationTest");

const player = new Player();
const role = new Role("role");
role.returnOne = function() { return 1; };
player.returnTwo = function() { return 2; };

player.plays(role);
expect(player.returnTwo()).to.equal(2);
expect(player.returnOne()).to.equal(1);
expect(role.returnTwo()).to.equal(2);
player.drops(role);
expect(function(){ player.returnOne() }).to.throw('could not find a method with id returnOne and args ');

console.log("finished roleDeceptionTest");