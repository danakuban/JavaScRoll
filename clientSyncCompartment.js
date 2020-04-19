const Compartment = require('./roleFramework/compartment.js');
const Constraint = require('./roleFramework/constraint.js');
const RoleGroup = require('./roleFramework/roleGroup.js');

class ClientSyncCompartment extends Compartment {

    constructor() {
        super("ClientSyncCompartment");
        let roleGroup = new RoleGroup("ClientSyncRoleGroup");
        roleGroup.addConstraint(new Constraint.MethodImplementedConstraint("entryPoint"));
        this.roleGroups.push(roleGroup);
    }

    addRole(role) {
        super.addRole(role);
        this.roleGroups.forEach(rg => { if (rg.name === "ClientSyncRoleGroup") rg.addRole(role) });
    }
}

module.exports = ClientSyncCompartment;