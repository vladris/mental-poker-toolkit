import { EventEmitter } from "events";
import { ITransport } from "@mental-poker-toolkit/types";
import { ILedger } from "fluid-ledger-dds";

class FluidTransport<T> extends EventEmitter implements ITransport<T> {
    constructor(private readonly ledger: ILedger<string>) {
        super();
        ledger.on("append", (value) => {
            this.emit("actionPosted", JSON.parse(value) as T);
        });
    }

    postAction(value: T) {
        this.ledger.append(JSON.stringify(value));
    }
}

export function makeFluidClient<T>(ledger: ILedger<string>): ITransport<T> {
    return new FluidTransport<T>(ledger);
}
