const expect = require("chai").expect;

const Role = require('../role.js');

console.log("start cyclicRoleTest");

const role = new Role("role");
const role2 = new Role("role2");
const role3 = new Role("role3");

role.plays(role2);
role2.plays(role3);
expect(function(){ role3.plays(role) }).to.throw('cyclic plays relation detected!');

console.log("finished cyclicRoleTest");