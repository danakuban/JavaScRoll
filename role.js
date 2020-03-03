const Player = require('./player.js');

class Role extends Player {
    constructor(name) {
        super();
        this.name = name;
        this.player = undefined;
    }
    // ParentClass.prototype.myMethod.call(this, arg1, arg2, ..) * Hint: use apply() instead of call() to pass arguments as an array.

    __noSuchMethod__(id, args) {
        console.log("tried to handle unknown method " + id);
        for (const role of this.roles) {
            try {
                role[id](args);
                console.log("found method " + id + " in role " + role.name)
            } catch(err) {
                console.log("could not find a method with name " + id + " in any role of this object");
            }
        }
    };
}

module.exports = Role;