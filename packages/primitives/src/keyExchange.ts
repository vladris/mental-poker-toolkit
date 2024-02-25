import { StateMachine } from "@mental-poker-toolkit/state-machine";
import {
    BaseAction,
    ClientId,
    IQueue,
    Key,
    KeyStore,
    PublicPrivateKeyPair,
} from "@mental-poker-toolkit/types";
import { Signing } from "@mental-poker-toolkit/cryptography";

// Action for exchanging public keys
export type KeyExchangeAction = BaseAction & { publicKey: Key };

// Context for the key exchange protocol
export type CryptoContext = {
    clientId: ClientId;
    me: PublicPrivateKeyPair;
    keyStore: KeyStore;
};

// Create a new crypto context
export async function makeCryptoContext(
    clientId: ClientId
): Promise<CryptoContext> {
    return {
        clientId,
        me: await Signing.generatePublicPrivateKeyPair(),
        keyStore: new Map<ClientId, Key>(),
    };
}

// Perform a public key exchange for a given number of players
export async function keyExchange(
    players: number,
    context: CryptoContext,
    actionQueue: IQueue<KeyExchangeAction>
) {
    const setKey = (action: KeyExchangeAction, context: CryptoContext) => {
        // This should be a KeyExchangeAction
        if (action.type !== "KeyExchange") {
            return false;
        }

        // Protocol expects clients to post an ID
        if (action.clientId === undefined) {
            return false;
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
        type: "KeyExchange",
        clientId: context.clientId,
        publicKey: context.me.publicKey,
    });

    // Create state machine
    const keyExchangeSequence = StateMachine.sequenceN(setKey, players);

    // Run state machine
    await StateMachine.run(keyExchangeSequence, actionQueue, context);
}
