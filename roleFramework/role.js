const Player = require('./player.js');

class Role extends Player {

    constructor(name) {
        super(name);
        this.playerList = [];
        this.player = null;
        this.compartments = [];
    }

    /**
     * override this method to execute code right after this role is played by a player
     */
    postPlayed() {
    }

    /**
     * override this method to execute code right after this role is dropped by a player
     */
    postDropped() {
    }

    __noSuchMethod__(id, ...args) {
        console.log("tried to handle unknown method " + id);
        for (const role of this.roles) {
            try {
                console.log("look for method " + id + " in role " + role.name);
                return role[id](...args);
            } catch(err) {
                console.log("could not find a method with name " + id + " in any role of this object");
            }
        }
        throw new Error("could not find a method with id " + id + " and args " + args);
    };
}

module.exports = Role;