const expect  = require("chai").expect;

const Player = require('../player.js');
const Role = require('../role.js');
const Compartment = require('../compartment.js');
const RoleGroup = require('../roleGroup.js');
const Constraints = require('../constraint.js');

const player = new Player();
const role = new Role("role");
const compartment = new Compartment("compartment");
compartment.addRole(role);
const roleGroup = new RoleGroup("roleGroup", role);
compartment.addRoleGroup(roleGroup);
const constraint = new Constraints.MethodImplementedConstraint("method");
roleGroup.addConstraint(constraint);

expect(function(){ player.plays(role) }).to.throw('player has no method method defined');
player.method = function(something) { console.log("method is now defined " + something); };
player.plays(role);
