import { BigIntMath, SRA } from "@mental-poker-toolkit/cryptography";
import { ClientId, SRAKeyPair } from "@mental-poker-toolkit/types";
import { StateMachine } from "@mental-poker-toolkit/state-machine";
import {
    RootStore,
    store,
    updateGameStatus,
    updateMyPlay,
    updateTheirPlay,
} from "./store";

// Workaround for BigInt serialization not being supported
type SerializedSRAKeyPair = {
    prime: string;
    enc: string;
    dec: string;
};

function serializeSRAKeyPair(kp: SRAKeyPair): SerializedSRAKeyPair {
    return {
        prime: SRA.bigIntToString(kp.prime),
        enc: SRA.bigIntToString(kp.enc),
        dec: SRA.bigIntToString(kp.dec),
    };
}

function deserializeSRAKeyPair(kp: SerializedSRAKeyPair): SRAKeyPair {
    return {
        prime: SRA.stringToBigInt(kp.prime),
        enc: SRA.stringToBigInt(kp.enc),
        dec: SRA.stringToBigInt(kp.dec),
    };
}

// Actions:

// PlayAction: A client posts their encrypted selection
export type PlayAction = {
    clientId: ClientId;
    type: "PlayAction";
    encryptedSelection: EncryptedSelection;
};

// RevealAction: A client reveals their selection by posting the encryption key
export type RevealAction = {
    clientId: ClientId;
    type: "RevealAction";
    key: SerializedSRAKeyPair;
};

// Action is the union of all possible actions
export type Action = PlayAction | RevealAction;

// Possible plays
export type PlaySelection = "Rock" | "Paper" | "Scissors";

// Game status
// Waiting: Waiting for other player to join or for turn to complete
// Ready: Ready to play
// Win | Loss | Draw: Game result
export type GameStatus = "Waiting" | "Ready" | "Win" | "Loss" | "Draw";

// Alias for encrypted selection
export type EncryptedSelection = string;

// PlayValue can be an encrypted selection, a decrypted selection, or none
export type PlayValue =
    | { type: "Selection"; value: PlaySelection }
    | { type: "Encrypted"; value: EncryptedSelection }
    | { type: "None"; value: undefined };

// Generate the play and reveal actions based on a selection
function makePlay(
    clientId: ClientId,
    selection: PlaySelection
): [PlayAction, RevealAction] {
    const kp = SRA.generateKeyPair(BigIntMath.randBigInt());

    return [
        {
            clientId,
            type: "PlayAction",
            encryptedSelection: SRA.encryptString(selection, kp),
        },
        { clientId, type: "RevealAction", key: serializeSRAKeyPair(kp) },
    ];
}

// Play a round of rock-paper-scissors
export async function playRound(selection: PlaySelection) {
    // Grab store
    const context = store;

    // Upadate game status
    context.dispatch(updateGameStatus("Waiting"));

    // Create play and reveal actions
    const [playAction, revealAction] = makePlay(
        store.getState().id.value,
        selection
    );

    // Get a reference to the action queue from the store
    const queue = store.getState().queue.value!;

    // A play turn consists of posting the encrypted selection
    const playTurn = (play: PlayAction, context: RootStore) => {
        const action =
            play.clientId === context.getState().id.value
                ? updateMyPlay
                : updateTheirPlay;

        context.dispatch(
            action({ type: "Encrypted", value: play.encryptedSelection })
        );

        return true;
    };

    // Post our play action
    context.getState().queue.value!.enqueue(playAction);

    // Both player and opponent need to post their encrypted selection
    await StateMachine.run(
        StateMachine.sequence([playTurn, playTurn]),
        queue,
        context
    );

    // Post our reveal action
    context.getState().queue.value!.enqueue(revealAction);

    // Second step is to reveal the selection
    const revealTurn = (reveal: RevealAction, context: RootStore) => {
        const action =
            reveal.clientId === context.getState().id.value
                ? updateMyPlay
                : updateTheirPlay;
        const originalValue =
            reveal.clientId === context.getState().id.value
                ? context.getState().myPlay.value
                : context.getState().theirPlay.value;

        context.dispatch(
            action({
                type: "Selection",
                value: SRA.decryptString(
                    originalValue.value as EncryptedSelection,
                    deserializeSRAKeyPair(reveal.key)
                ) as PlaySelection,
            })
        );

        return true;
    };

    await StateMachine.run(
        StateMachine.sequenceN(revealTurn, 2),
        queue,
        context
    );

    // Determine game result
    const myPlay = context.getState().myPlay.value;
    const theirPlay = context.getState().theirPlay.value;

    console.log(`My play: ${myPlay.value}, Their play: ${theirPlay.value}`);

    if (myPlay.type === "Selection" && theirPlay.type === "Selection") {
        if (myPlay.value === theirPlay.value) {
            context.dispatch(updateGameStatus("Draw"));
        } else if (
            (myPlay.value === "Rock" && theirPlay.value === "Scissors") ||
            (myPlay.value === "Paper" && theirPlay.value === "Rock") ||
            (myPlay.value === "Scissors" && theirPlay.value === "Paper")
        ) {
            context.dispatch(updateGameStatus("Win"));
        } else {
            context.dispatch(updateGameStatus("Loss"));
        }
    } else {
        throw new Error("Unexpected game state");
    }
}
