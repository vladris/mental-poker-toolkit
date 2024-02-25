import { StateMachine } from "@mental-poker-toolkit/state-machine";
import {
    BaseAction,
    ClientId,
    IQueue,
    ITransport,
    Key,
    KeyStore,
    PublicPrivateKeyPair,
    Signed,
} from "@mental-poker-toolkit/types";
import { Signing } from "@mental-poker-toolkit/cryptography";

export type KeyExchangeAction = BaseAction & { publicKey: Key };

export type CryptoContext = {
    clientId: ClientId;
    me: PublicPrivateKeyPair;
    first: ClientId | undefined;
    keyStore: KeyStore;
};

export async function makeCryptoContext(
    clientId: ClientId
): Promise<CryptoContext> {
    return {
        clientId,
        me: await Signing.generatePublicPrivateKeyPair(),
        first: undefined,
        keyStore: new Map<ClientId, Key>(),
    };
}

export async function keyExchange(
    players: number,
    context: CryptoContext,
    actionQueue: IQueue<KeyExchangeAction>
) {
    const setKey = (action: KeyExchangeAction, context: CryptoContext) => {
        // This should be a KeyExchangeAction
        if (action.type !== "keyExchange") {
            return false;
        }

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
    };

    // Post public key
    await actionQueue.enqueue({
        type: "keyExchange",
        clientId: context.clientId,
        publicKey: context.me.publicKey,
    });

    // Create state machine
    const keyExchangeSequence = StateMachine.sequenceN(setKey, players);

    // Run state machine
    await StateMachine.run(keyExchangeSequence, actionQueue, context);
}
