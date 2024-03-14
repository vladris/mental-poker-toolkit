import { ClientId, IQueue } from "@mental-poker-toolkit/types";
import { SerializedSRAKeyPair } from "@mental-poker-toolkit/cryptography";
import { StateMachine as sm } from "@mental-poker-toolkit/state-machine";
import { RootStore, store, updateGameStatus } from "./store";

export type DealAction = {
    clientId: ClientId;
    type: "DealAction";
    cards: number[];
    keys: SerializedSRAKeyPair[];
}

export type DrawRequestAction = {
    clientId: ClientId;
    type: "DrawRequest";
    cardIndex: number;
}

export type DrawResponseAction = {
    clientId: ClientId;
    type: "DrawResponse";
    cardIndex: number;
    key: SerializedSRAKeyPair;
}

export type DiscardRequestAction = {
    clientId: ClientId;
    type: "DiscardRequest";
    cardIndex: number;
    key: SerializedSRAKeyPair;
}

export type PassTurnAction = {
    clientId: ClientId;
    type: "PassTurn";
}

export type Action = DealAction | DrawRequestAction | DrawResponseAction | DiscardRequestAction | PassTurnAction;

export type GameStatus = "Waiting" | "Shuffling" | "Dealing" | "MyTurn" | "OthersTurn" | "Win" | "Loss" | "Draw";

// Deal the cards - each player posts the encrypted keys for the cards the other player is supposed 
// to draw
export async function deal(imFirst: boolean) {
    const queue = store.getState().queue.value!;

    // This keeps track of cards the *other* player is supposed to draw, so we can hand them the
    // keys - first player draws first 7, second player draws next 7
    const cards = new Array(7).fill(0).map((_, i) => imFirst ? i + 7 : i);
    const keys = cards.map((card) => store.getState().deck.value!.getKey(card)!);

    await sm.run(sm.sequence([
        sm.local(async (queue: IQueue<Action>, context: RootStore) => {
            queue.enqueue({ 
                clientId: context.getState().id.value, 
                type: "DealAction",
                cards,
                keys });
        }),
        sm.repeat(sm.transition(async (action: DealAction, context: RootStore) => {
            if (action.type !== "DealAction") {
                throw new Error("Invalid action type");
            }

            // Ignore our own action
            if (action.clientId === context.getState().id.value) {
                return;
            }

            const deck = context.getState().deck.value!;

            // We got keys from the other player
            for (let i = 0; i < action.cards.length; i++) {
                // If we're first, we draw cards
                if (imFirst) {
                    if (action.cards[i] !== i) {
                        throw new Error("Unexpected card index");
                    }
                    await deck.myDraw(action.keys[i]);
                // Otherwise other player draws first    
                } else {
                    await deck.othersDraw();
                }
            }

            for (let i = 0; i < action.cards.length; i++) {
                // If we're first, we now let the other player draw cards
                if (imFirst) {
                    await deck.othersDraw();
               // Otherwise it is our turn to draw    
                } else {
                    if (action.cards[i] !== i + action.cards.length) {
                        throw new Error("Unexpected card index");
                    }
                    await deck.myDraw(action.keys[i]);
                }
            }
        }), 0)
    ]), queue, store);
}

// Draw a card - this is a multi-step process: we request a card draw providing the card index and
// the other player should respond with the card index and the key used to encrypt the card
export async function drawCard() {
    // Get a reference to the action queue from the store
    const queue = store.getState().queue.value!;

    await store.dispatch(updateGameStatus("Waiting"));

    sm.run([
        sm.local(async (queue: IQueue<Action>, context: RootStore) => {
            queue.enqueue({ 
                clientId: context.getState().id.value, 
                type: "DrawRequest",
                cardIndex: context.getState().deck.value!.getDrawIndex() });
        }),
        sm.transition((action: DrawRequestAction) => {
            // Our own draw request, no need to do anything
            if (action.type !== "DrawRequest") {
                throw new Error("Invalid action type");
            }
        }),
        sm.transition(async (action: DrawResponseAction, context: RootStore) => {
            // Response from other player
            if (action.type !== "DrawResponse") {
                throw new Error("Invalid action type");
            }

            await context.getState().deck.value!.myDraw(action.key);
        }),
    ], queue, store);

    await store.dispatch(updateGameStatus("MyTurn"));
}

// Discard a card - this is a single-step process - we provide the card index and the key used to
// encrypt it; the other player already has their own key
export async function discardCard(index: number) {
    // Get a reference to the action queue from the store
    const queue = store.getState().queue.value!;

    await store.dispatch(updateGameStatus("Waiting"));

    await sm.run([
        sm.local(async (queue: IQueue<Action>, context: RootStore) => {
            queue.enqueue({
                clientId: context.getState().id.value, 
                type: "DiscardRequest",
                cardIndex: index,
                key: context.getState().deck.value!.getKey(index)});
        }),
        sm.transition(async (action: DiscardRequestAction, context: RootStore) => {
            // Our own discard request, update the deck
            if (action.type !== "DiscardRequest") {
                throw new Error("Invalid action type");
            }

            await context.getState().deck.value!.myDiscard(action.cardIndex);
        }),
    ], queue, store);

    await store.dispatch(updateGameStatus("MyTurn"));
}

// Pass the turn
export async function passTurn() {
    await store.dispatch(updateGameStatus("OthersTurn"));

    await store.getState().queue.value!.enqueue({
        clientId: store.getState().id.value,
        type: "PassTurn",
    });
}

// Wait for the opponent to take an action and respond based on that
export async function waitForOpponent() {
    const queue = store.getState().queue.value!;

    while (true) {
        // Dequeue the other player's action to decide next steps
        const othersAction = await queue.dequeue();

        switch (othersAction.type) {
            case "DrawRequest":
                await sm.run([
                    sm.local(async (queue: IQueue<Action>, context: RootStore) => {
                        // Ensure other player is drawing from the top of the deck
                        if (othersAction.cardIndex !== store.getState().deck.value!.getDrawIndex()) {
                            throw new Error("Invalid card index for draw");
                        }

                        await queue.enqueue({
                            clientId: store.getState().id.value,
                            type: "DrawResponse",
                            cardIndex: othersAction.cardIndex,
                            key: store.getState().deck.value!.getKey(othersAction.cardIndex)
                        })}),
                    sm.transition(async (action: DrawResponseAction, context: RootStore) => {
                        // Update the deck once our response was sequenced
                        if (action.type !== "DrawResponse") {
                            throw new Error("Invalid action type");
                        }

                        await context.getState().deck.value!.othersDraw();
                    })], queue, store);
                break;
            case "DiscardRequest":
                // No need to respond to a discard request, just update state
                await store.getState().deck.value!.othersDiscard(othersAction.cardIndex, othersAction.key); 
                break
            case "PassTurn":
                // The other player passed the turn
                await store.dispatch(updateGameStatus("MyTurn"));
                return;
        }
    }
}
