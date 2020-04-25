function enableNoSuchMethod(obj) {
    return new Proxy(obj, {
        get(target, p) {
            if (p in target) {
                return target[p];
            } else if (typeof target.__noSuchMethod__ === "function") {
                if (typeof (obj.player) !== "undefined" && obj.player != null) {
                    if (p in obj.player) {
                        return obj.player[p];
                    }
                }
                for (const role of obj.roles) {
                    if (p in role) {
                        return role[p];
                    }
                }
                return function (...args) {
                    return target.__noSuchMethod__.call(target, p, ...args);
                };
            }
        }
    });
}

class Player {

    constructor() {
        this.roles = [];
        return enableNoSuchMethod(this);
    }

    plays(role) {
        this.checkPlaysCycleBackwards(role);
        this.checkPlaysCycleForwards(role);

        if (role.compartment != null) role.compartment.validate(this, role);
        this.roles.push(role);

        // update reverse links
        if (this.playerList != null) this.playerList.forEach(p => role.playerList.push(p));
        role.playerList.push(this);
        role.player = this;

        role.postPlayed();
    }

    checkPlaysCycleForwards(role) {
        if (this.roles.includes(role)) throw new Error("player plays this role already");
        for (let roleToCheck of this.roles) {
            roleToCheck.checkPlaysCycleForwards(role);
        }
    }

    checkPlaysCycleBackwards(role) {
        if (this.playerList == null || !Array.isArray(this.playerList)) return;
        this.playerList.forEach(p => { if (p === role) throw new Error('cyclic plays relation detected!'); });
    }

    drops(role) {
        console.log(role.name);
        this.roles = this.roles.filter(item => item !== role);
        role.player = null;
        role.postDropped();
    }

    __noSuchMethod__(id, ...args) {
        console.log("tried to handle unknown method " + id);
        for (const role of this.roles) {
            try {
                console.log("found method " + id + " in role " + role.name);
                return role[id](...args);
            } catch (err) {
                console.log("could not find a method with name " + id + " in role " + role.name);
            }
        }
        throw new Error("could not find a method with id " + id + " and args " + args);
    };
}

module.exports = Player;