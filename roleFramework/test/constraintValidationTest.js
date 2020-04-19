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
const roleGroup = new RoleGroup("roleGroup", role);
compartment.addRoleGroup(roleGroup);
const constraint = new Constraints.MethodImplementedConstraint("method");
roleGroup.addConstraint(constraint);
// TODO: shortcut for compartment with one role and constraint?
// TODO: method from role

const player = new Player();
expect(function(){ player.plays(role) }).to.throw('player has no method method defined');
player.method = function(something) { console.log("method is now defined " + something); };
player.plays(role);

console.log("finished constraintValidationTest");
