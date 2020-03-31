class RoleGroup {

    constructor(name, roles) {
        this.name = name;
        this.roles = Array.isArray(roles) ? roles : Array.of(roles);
        this.constraints = [];
    }

    addRole(role) {
        this.roles.push(role);
    }

    addConstraint(constraint) {
        this.constraints.push(constraint);
    }

    validate(player) {
        this.constraints.forEach(constraint => constraint.validate(player));
    }
}

module.exports = RoleGroup;