import { BigIntUtils, SRA, SerializedSRAKeyPair, SRAKeySerializationHelper } from "@mental-poker-toolkit/cryptography";
import { ClientId } from "@mental-poker-toolkit/types";
import { StateMachine as sm } from "@mental-poker-toolkit/state-machine";
import {
    RootStore,
    store,
    updateGameStatus,
    updateMyPlay,
    updateTheirPlay,
} from "./store";

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

// Play a round of rock-paper-scissors
export async function playRound(selection: PlaySelection) {
    // Grab store
    const context = store;

    // Upadate game status
    await context.dispatch(updateGameStatus("Waiting"));

    // Get a reference to the action queue from the store
    const queue = store.getState().queue.value!;

    // Generate a new key pair
    const kp = SRA.generateKeyPair(BigIntUtils.randPrime());

    await sm.run(sm.sequence([
            // Post our play action
            sm.local(async (queue) => {
                const playAction = {
                    clientId: context.getState().id.value,
                    type: "PlayAction",
                    encryptedSelection: SRA.encryptString(selection, kp),
                };

                await queue.enqueue(playAction);
            }),
            // Both player and opponent need to post their encrypted selection
            sm.repeat(sm.transition(async (play: PlayAction, context: RootStore) => {
                const action =
                play.clientId === context.getState().id.value
                    ? updateMyPlay
                    : updateTheirPlay;
    
                await context.dispatch(
                    action({ type: "Encrypted", value: play.encryptedSelection })
            );
            }), 2),
            // Post our reveal action
            sm.local(async (queue) => {
                const revealAction = {
                    clientId: context.getState().id.value,
                    type: "RevealAction",
                    key: SRAKeySerializationHelper.serializeSRAKeyPair(kp),
                };
                
                await queue.enqueue(revealAction);
            }),
            // Both player and opponent need to reveal their selection
            sm.repeat(sm.transition(async (reveal: RevealAction, context: RootStore) => {
                const action =
                    reveal.clientId === context.getState().id.value
                        ? updateMyPlay
                        : updateTheirPlay;
                const originalValue =
                    reveal.clientId === context.getState().id.value
                        ? context.getState().myPlay.value
                        : context.getState().theirPlay.value;
    
                await context.dispatch(
                    action({
                        type: "Selection",
                        value: SRA.decryptString(
                            originalValue.value as EncryptedSelection,
                            SRAKeySerializationHelper.deserializeSRAKeyPair(reveal.key)
                        ) as PlaySelection,
                    })
                );
            }), 2)
        ]), queue, context);

    // Determine game result
    const myPlay = context.getState().myPlay.value;
    const theirPlay = context.getState().theirPlay.value;

    console.log(`My play: ${myPlay.value}, Their play: ${theirPlay.value}`);

    if (myPlay.type === "Selection" && theirPlay.type === "Selection") {
        if (myPlay.value === theirPlay.value) {
            await context.dispatch(updateGameStatus("Draw"));
        } else if (
            (myPlay.value === "Rock" && theirPlay.value === "Scissors") ||
            (myPlay.value === "Paper" && theirPlay.value === "Rock") ||
            (myPlay.value === "Scissors" && theirPlay.value === "Paper")
        ) {
            await context.dispatch(updateGameStatus("Win"));
        } else {
            await context.dispatch(updateGameStatus("Loss"));
        }
    } else {
        throw new Error("Unexpected game state");
    }
}
