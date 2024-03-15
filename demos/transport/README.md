# Transport demo

This package is used by the other demo packages to establish a connection to
a local Fluid server and get an `ITransport` instance.

## Implementation notes

`container.ts` initializes a [Fluid Framework container](https://fluidframework.com/docs/build/containers/)
containing a [Fluid Ledger](https://github.com/vladris/fluid-ledger). It uses
the toolkit's `FluidClient` to wrap the ledger in an `ITransport` interface.

The demo code is hard-coded to expect a local Fluid server. In a real
implementation you would connect to an [Azure Fluid Relay](https://learn.microsoft.com/en-us/azure/azure-fluid-relay/).
