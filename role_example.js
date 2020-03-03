var Player = require('./player.js');
var Role = require('./role.js');

const player = new Player();
const role = new Role("role");
role.saySomething = function() {
    console.log("Hi there! My birthday is " + this.birthday);
};
player.sayHi = function() {
    console.log("player says hi");
};
player.birthday = 'today';

player.plays(role);
player.sayHi();
player.saySomething();
role.sayHi();
player.drops(role);
player.saySomething();