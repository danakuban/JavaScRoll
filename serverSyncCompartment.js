const Compartment = require('./roleFramework/compartment.js');
const Constraint = require('./roleFramework/constraint.js');
const RoleGroup = require('./roleFramework/roleGroup.js');

class ServerSyncCompartment extends Compartment {

    constructor() {
        super("ServerSyncCompartment");
        let roleGroup = new RoleGroup("ServerSyncRoleGroup");
        roleGroup.addConstraint(new Constraint.MethodImplementedConstraint("startServer"))
        this.roleGroups.push(roleGroup);
    }

    addRole(role) {
        super.addRole(role);
        this.roleGroups.forEach(rg => { if (rg.name === "ServerSyncRoleGroup") rg.addRole(role) });
    }
}

module.exports = ServerSyncCompartment;