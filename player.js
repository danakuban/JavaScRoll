function enableNoSuchMethod(obj) {
    return new Proxy(obj, {
        get(target, p) {
            if (p in target) {
                return target[p];
            } else if (typeof target.__noSuchMethod__ === "function") {
                //console.log(obj);
                if (typeof(obj.player) !== "undefined") {
                    if (p in obj.player) {
                        return obj.player[p];
                    }
                }
                for (const role of obj.roles) {
                    // todo: search in role's roles
                    if (p in role) {
                        return role[p];
                    }
                }
                return function (...args) {
                    return target.__noSuchMethod__.call(target, p, args);
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
        this.drops(role);
        this.roles.push(role);
        role.player = this;
    }

    drops(role) {
        console.log(role.name);
        this.roles = this.roles.filter(item => item !== role);
        role.player = undefined;
    }

    __noSuchMethod__(id, args) {
        console.log("tried to handle unknown method " + id);
        for (const role of this.roles) {
            try {
                role[id](args);
                console.log("found method " + id + " in role " + role.name)
            } catch (err) {
                console.log("could not find a method with name " + id + " in any role of this object");
            }
        }
    };
}

module.exports = Player;