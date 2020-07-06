const Player = require('./player.js');
const RoleGroup = require('./roleGroup.js');

class Compartment extends Player {

    constructor(name) {
        super();
        this.name = name;
        this.rolesIncluded = [];
        this.roleGroups = [];
    }

    addRole(role) {
        if (role.compartment != null) throw new Error("role can only be added to one compartment!");
        console.log("add " + role.name + " to compartment " + this.name);
        this.rolesIncluded.push(role);
        role.compartment = this;
    }

    addRoleGroup(roleGroup) {
        // TODO: check if all roles in this group are in the compartment itself
        // TODO: only add empty roleGroups?
        this.roleGroups.push(roleGroup);
    }

    /**
     * @returns RoleGroup
     */
    creatRoleGroup(name, roles, constraint) {
        let roleGroup = new RoleGroup(name)
        if (Array.isArray(roles)) roles.forEach(r => roleGroup.addRole(r));
        else roleGroup.addRole(roles);
        roleGroup.addConstraint(constraint);
        this.addRoleGroup(roleGroup);
        return roleGroup;
    }

    validate(player, role) {
        this.roleGroups.filter(rg => rg.roles.includes(role)).forEach(rg => rg.validate(player));
    }
}

module.exports = Compartment;