import { StateMachine as sm } from "@mental-poker-toolkit/state-machine";
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
type KeyExchangeAction = {
    clientId: ClientId;
    type: "KeyExchange";
    publicKey: Key;
};

// Context for the key exchange protocol
type CryptoContext = {
    clientId: ClientId;
    me: PublicPrivateKeyPair;
    keyStore: KeyStore;
};

// Create a new crypto context
async function makeCryptoContext(clientId: ClientId): Promise<CryptoContext> {
    return {
        clientId,
        me: await Signing.generatePublicPrivateKeyPair(),
        keyStore: new Map<ClientId, Key>(),
    };
}

// Create sequence for key exchange
function makeKeyExchangeSequence(players: number) {
    return sm.sequence([
        sm.local(
            async (
                actionQueue: IQueue<KeyExchangeAction>,
                context: CryptoContext
            ) => {
                // Post public key
                await actionQueue.enqueue({
                    type: "KeyExchange",
                    clientId: context.clientId,
                    publicKey: context.me.publicKey,
                });
            }
        ),
        sm.repeat(
            sm.transition(
                (action: KeyExchangeAction, context: CryptoContext) => {
                    // This should be a KeyExchangeAction
                    if (action.type !== "KeyExchange") {
                        throw new Error("Invalid action type");
                    }

                    // Protocol expects clients to post an ID
                    if (action.clientId === undefined) {
                        throw new Error("Expected client ID");
                    }

                    // Protocol expects each client to only post once and to have a unique ID
                    if (context.keyStore.has(action.clientId)) {
                        throw new Error(
                            "Same client posted key multiple times"
                        );
                    }

                    context.keyStore.set(action.clientId, action.publicKey);
                }
            ),
            players
        ),
    ]);
}

// Perform a public key exchange for a given number of players
export async function keyExchange(
    players: number,
    clientId: ClientId,
    actionQueue: IQueue<BaseAction>
) {
    const context = await makeCryptoContext(clientId);

    const keyExchangeSequence = makeKeyExchangeSequence(players);

    // Run state machine
    await sm.run(keyExchangeSequence, actionQueue, context);

    return [context.me, context.keyStore] as const;
}
