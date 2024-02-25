import { EventEmitter } from "events";
import {
    BaseAction,
    ClientKey,
    ITransport,
    KeyStore,
    Signed,
} from "@mental-poker-toolkit/types";
import { Signing } from "@mental-poker-toolkit/cryptography";

export class SignedTransport<T extends BaseAction>
    extends EventEmitter
    implements ITransport<T>
{
    constructor(
        private readonly transport: ITransport<Signed<T>>,
        private readonly clientKey: ClientKey,
        private readonly keyStore: KeyStore
    ) {
        super();
        transport.on("actionPosted", async (value) => {
            this.emit("actionPosted", await this.verifySignature(value));
        });
    }

    *getActions() {
        for (const value of this.transport.getActions()) {
            yield value;
        }
    }

    async postAction(value: T) {
        this.transport.postAction(await this.signAction(value));
    }

    private async signAction(value: T): Promise<Signed<T>> {
        const signature = await Signing.sign(
            JSON.stringify(value),
            this.clientKey.privateKey
        );

        return {
            ...value,
            signature: signature,
        };
    }

    private async verifySignature(value: Signed<T>): Promise<T> {
        if (!value.signature) {
            throw Error("Message missing signature");
        }

        // Remove signature from object and store it
        const signature = value.signature;
        delete value.signature;

        // Figure out which public key we need to use
        const publicKey = this.keyStore.get(value.clientId);

        if (!publicKey) {
            throw Error(`No public key available for client ${value.clientId}`);
        }

        if (
            !(await Signing.verifySignature(
                JSON.stringify(value),
                signature,
                publicKey
            ))
        ) {
            throw new Error("Signature validation failed");
        }

        return value;
    }
}
