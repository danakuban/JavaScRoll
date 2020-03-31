class Constraint {
    constructor() {
        if (this.constructor === Constraint) {
            throw new TypeError('Abstract class "Constraint" cannot be instantiated directly.');
        }

        if (this.validate === undefined) {
            throw new TypeError('Classes extending the Contraint abstract class must provide a method validate()');
        }
    }
}

class MethodImplementedConstraint extends Constraint {

    constructor(method) {
        super();
        this.method = method;
    }

    validate(player) {
        try {
            player[this.method]()
        } catch(error) {
            throw new Error("player has no method " + this.method + " defined");
        }
    }
}

module.exports = {
    MethodImplementedConstraint : MethodImplementedConstraint
};