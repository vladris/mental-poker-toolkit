import {
    AzureClient,
    AzureLocalConnectionConfig,
} from "@fluidframework/azure-client";
import { IFluidContainer } from "fluid-framework";
import { Ledger } from "fluid-ledger-dds";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import { makeFluidClient } from "@mental-poker-toolkit/fluid-client";
import { ITransport } from "@mental-poker-toolkit/types";

// Stub user
const user = {
    id: "userId",
    name: "userName",
};

// Using a local Azure client for the demo. When running against an Azure
// instance, see instructions here:
// https://learn.microsoft.com/en-us/azure/azure-fluid-relay/how-tos/connect-fluid-azure-service
const localConnectionConfig: AzureLocalConnectionConfig = {
    type: "local",
    tokenProvider: new InsecureTokenProvider("", user),
    endpoint: "http://localhost:7070",
};

// Gets a reference to a ledger DDS instance
export async function getLedger<T>(): Promise<ITransport<T>> {
    const client = new AzureClient({ connection: localConnectionConfig });

    // Simple Fluid container containing just a Ledger
    const containerSchema = {
        initialObjects: { myLedger: Ledger },
    };

    // If our window's URL contains a container GUID, we load the container. If
    // not, we create a new container other clients can connect to and update
    // the URL.
    let container: IFluidContainer;
    const containerId = window.location.hash.substring(1);
    if (containerId) {
        ({ container } = await client.getContainer(
            containerId,
            containerSchema
        ));
    } else {
        ({ container } = await client.createContainer(containerSchema));
        const id = await container.attach();
        window.location.hash = id;
    }

    // Get ledger
    const ledger = container.initialObjects.myLedger as Ledger<string>;

    // Wrap ledger in a FluidClient
    return makeFluidClient(ledger);
}
