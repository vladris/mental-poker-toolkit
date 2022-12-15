"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLedger = void 0;
const azure_client_1 = require("@fluidframework/azure-client");
const fluid_ledger_dds_1 = require("fluid-ledger-dds");
const test_client_utils_1 = require("@fluidframework/test-client-utils");
const fluid_client_1 = require("@mental-poker-toolkit/fluid-client");
// Stub user
const user = {
    id: "userId",
    name: "userName",
};
// Using a local Azure client for the demo. When running against an Azure
// instance, see instructions here:
// https://learn.microsoft.com/en-us/azure/azure-fluid-relay/how-tos/connect-fluid-azure-service
const localConnectionConfig = {
    type: "local",
    tokenProvider: new test_client_utils_1.InsecureTokenProvider("", user),
    endpoint: "http://localhost:7070",
};
// Gets a reference to a ledger DDS instance
async function getLedger() {
    const client = new azure_client_1.AzureClient({ connection: localConnectionConfig });
    // Simple Fluid container containing just a Ledger
    const containerSchema = {
        initialObjects: { myLedger: fluid_ledger_dds_1.Ledger },
    };
    // If our window's URL contains a container GUID, we load the container. If
    // not, we create a new container other clients can connect to and update
    // the URL.
    let container;
    const containerId = window.location.hash.substring(1);
    if (containerId) {
        ({ container } = await client.getContainer(containerId, containerSchema));
    }
    else {
        ({ container } = await client.createContainer(containerSchema));
        const id = await container.attach();
        window.location.hash = id;
    }
    // Get ledger
    const ledger = container.initialObjects.myLedger;
    // Wrap ledger in a FluidClient
    return (0, fluid_client_1.makeFluidClient)(ledger);
}
exports.getLedger = getLedger;
