import { StateMachine } from "@mental-poker-toolkit/state-machine";
import {
    BaseAction,
    ClientId,
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
    transport: ITransport<KeyExchangeAction>
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
    transport.postAction({
        type: "keyExchange",
        clientId: context.clientId,
        publicKey: context.me.publicKey,
    });

    // Process existing public keys
    for (const action of transport.getActions()) {
        if (!setKey(action, context)) {
            throw new Error(`Invalid action ${action}`);
        }

        // If we have all the keys, we're done
        if (context.keyStore.size === players) {
            return Promise.resolve();
        }
    }

    // Wait for the rest of the players
    const waitForPlayers = StateMachine.sequenceN(
        setKey,
        players - context.keyStore.size
    );

    // Store result promise
    const result = StateMachine.run(waitForPlayers, transport, context);

    return result;
}
