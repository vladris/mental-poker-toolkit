import { StateMachine } from "@mental-poker-toolkit/state-machine";
import { BaseAction, ClientId, ITransport, Key, KeyStore, PublicPrivateKeyPair, Signed } from "@mental-poker-toolkit/types"
import { Signing } from "@mental-poker-toolkit/cryptography";

export type KeyExchangeAction = BaseAction & { publicKey: Key };

export type CryptoContext = {
    id: string,
    me: PublicPrivateKeyPair,
    first: ClientId | undefined,
    keyStore: KeyStore
};

export async function makeCryptoContext(id: string): Promise<CryptoContext> {
    return {
        id,
        me: await Signing.generatePublicPrivateKeyPair(),
        first: undefined,
        keyStore: new Map<ClientId, Key>()
    };
}

export async function keyExchange(context: CryptoContext, transport: ITransport<Signed<KeyExchangeAction>>) {
    const setKey = (action: Signed<KeyExchangeAction>, context: CryptoContext) => {
        // Protocol expects clients to post an ID
        if (action.clientId === undefined) {
            return false;
        }

        // Remember the first client that posted
        if (context.first === undefined) {
            context.first = action.clientId;
        }

        // Protocol expects each client to only post once and to have a unique ID
        if (context.keyStore.has(action.clientId)) {
            return false;
        }

        context.keyStore.set(action.clientId, action.publicKey);
        return true;
    }

    // Two players sit down at the table
    const sitDown = StateMachine.sequence([setKey, setKey]);

    // Store result promise
    const result = StateMachine.run(sitDown, transport, context);

    // Post public key
    transport.postAction({
        type: "keyExchange",
        clientId: context.id,
        publicKey: context.me.publicKey
    });

    return result;
}
