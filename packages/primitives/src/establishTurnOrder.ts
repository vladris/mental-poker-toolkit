import { StateMachine } from "@mental-poker-toolkit/state-machine";
import { BaseAction, ClientId, IQueue } from "@mental-poker-toolkit/types";
import { BigIntMath, SRA } from "@mental-poker-toolkit/cryptography";

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

// Perform a public key exchange for a given number of players
export async function establishTurnOrder<T extends BaseAction>(
    players: number,
    clientId: ClientId,
    actionQueue: IQueue<T>
): Promise<[bigint, ClientId[]]> {
    const context = makeEstablishTurnOrderContext(clientId);

    const postPrime = (
        action: EstablishTurnOrderAction,
        context: EstablishTurnOrderContext
    ) => {
        // This should be an EstablishTurnOrderAction
        if (action.type !== "EstablishTurnOrder") {
            return false;
        }

        // First client to post sets the shared prime
        if (context.turnOrder.length === 0) {
            context.prime = SRA.stringToBigInt(action.prime);
        }

        // Each client should only post once
        if (context.turnOrder.find((id) => id === action.clientId)) {
            return false;
        }

        context.turnOrder.push(action.clientId);

        return true;
    };

    // Post large prime
    await (actionQueue as unknown as IQueue<EstablishTurnOrderAction>).enqueue({
        type: "EstablishTurnOrder",
        clientId: context.clientId,
        prime: SRA.bigIntToString(BigIntMath.randPrime()),
    });

    // Create state machine
    const establishTurnOrderSequence = StateMachine.sequenceN(
        postPrime,
        players
    );

    // Run state machine
    await StateMachine.run(establishTurnOrderSequence, actionQueue, context);

    return [context.prime as bigint, context.turnOrder];
}
