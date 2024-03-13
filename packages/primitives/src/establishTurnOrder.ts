import { StateMachine as sm } from "@mental-poker-toolkit/state-machine";
import { BaseAction, ClientId, IQueue } from "@mental-poker-toolkit/types";
import { BigIntUtils } from "@mental-poker-toolkit/cryptography";

// Workaround for BigInt serialization not being supported
type SerializedPrime = string;

// Action for establishing turn order and shared prime
type EstablishTurnOrderAction = BaseAction & { prime: SerializedPrime };

// Context for establishing turn order
type EstablishTurnOrderContext = {
    clientId: ClientId;
    prime: bigint | undefined;
    turnOrder: ClientId[];
};

// Create a new context for establishing turn order
function makeEstablishTurnOrderContext(
    clientId: ClientId
): EstablishTurnOrderContext {
    return {
        clientId,
        prime: undefined,
        turnOrder: [],
    };
}

function makeEstablishTurnOrderSequence(players: number) {
    return sm.sequence([
        sm.local(async (actionQueue: IQueue<EstablishTurnOrderAction>, context: EstablishTurnOrderContext) => {
            // Post large prime
            await actionQueue.enqueue({
                type: "EstablishTurnOrder",
                clientId: context.clientId,
                prime: BigIntUtils.bigIntToString(BigIntUtils.randPrime()),
            });
        }),
        sm.repeat(sm.transition((action: EstablishTurnOrderAction, context: EstablishTurnOrderContext) => {
            // This should be an EstablishTurnOrderAction
            if (action.type !== "EstablishTurnOrder") {
                throw new Error("Invalid action type");
            }

            // First client to post sets the shared prime
            if (context.turnOrder.length === 0) {
                context.prime = BigIntUtils.stringToBigInt(action.prime);
            }

            // Each client should only post once
            if (context.turnOrder.find((id) => id === action.clientId)) {
                throw new Error("Same client posted prime multiple times");
            }

            context.turnOrder.push(action.clientId); 
        }), players)
    ]);
}

// Perform a public key exchange for a given number of players
export async function establishTurnOrder(
    players: number,
    clientId: ClientId,
    actionQueue: IQueue<BaseAction>
) {
    const context = makeEstablishTurnOrderContext(clientId);

    // Create state machine
    const establishTurnOrderSequence = makeEstablishTurnOrderSequence(players);

    // Run state machine
    await sm.run(establishTurnOrderSequence, actionQueue, context);

    return [context.prime!, context.turnOrder] as const;
}
