const expect = require("chai").expect;

const Player = require('../player');
const Role = require('../role');
const Compartment = require('../compartment');
const RoleGroup = require('../roleGroup');
const Constraints = require('../constraint');

console.log("start constraintValidationTest");

const role = new Role("role");
const compartment = new Compartment("compartment");
compartment.addRole(role);
let constraint = new Constraints.MethodImplementedConstraint("method");
let roleGroup = compartment.creatRoleGroup("roleGroup", role, constraint);

const player = new Player();
expect(function(){ player.plays(role) }).to.throw('player has no method method defined');
player.method = function(something) { console.log("method is now defined " + something); };
player.plays(role);

console.log("finished constraintValidationTest");