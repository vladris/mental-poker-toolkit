import { EventEmitter } from "events";
import {
    ClientKey,
    ITransport,
    KeyStore,
    Signed,
} from "@mental-poker-toolkit/types";
import { Signing } from "@mental-poker-toolkit/cryptography";

export class SignedTransport<T> extends EventEmitter implements ITransport<T> {
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
            clientId: this.clientKey.clientId,
            signature: signature,
        };
    }

    private async verifySignature(value: Signed<T>): Promise<T> {
        if (!value.clientId || !value.signature) {
            throw Error("Message missing signature");
        }

        // Remove signature and client ID from object and store them
        const clientId = value.clientId;
        const signature = value.signature;

        delete value.clientId;
        delete value.signature;

        // Figure out which public key we need to use
        const publicKey = this.keyStore.get(clientId);

        if (!publicKey) {
            throw Error(`No public key available for client ${clientId}`);
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
