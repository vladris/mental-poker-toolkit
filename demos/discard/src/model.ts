import { ClientId, IQueue } from "@mental-poker-toolkit/types";
import { SerializedSRAKeyPair } from "@mental-poker-toolkit/cryptography";
import { StateMachine as sm } from "@mental-poker-toolkit/state-machine";
import { RootStore, store, updateGameStatus } from "./store";

// Discard game actions

// Deal cards
export type DealAction = {
    clientId: ClientId;
    type: "DealAction";
    cards: number[];
    keys: SerializedSRAKeyPair[];
}

// Request to draw a card (need key from other player)
export type DrawRequestAction = {
    clientId: ClientId;
    type: "DrawRequest";
    cardIndex: number;
}

// Response to draw request (provides key for card)
export type DrawResponseAction = {
    clientId: ClientId;
    type: "DrawResponse";
    cardIndex: number;
    key: SerializedSRAKeyPair;
}

// Request to discard a card (provides key for card to other player)
export type DiscardRequestAction = {
    clientId: ClientId;
    type: "DiscardRequest";
    cardIndex: number;
    key: SerializedSRAKeyPair;
}

// Can't move - let's the other player know the game is over
export type CantMoveAction = {
    clientId: ClientId;
    type: "CantMove";
}

export type Action = DealAction | DrawRequestAction | DrawResponseAction | DiscardRequestAction | CantMoveAction;

export type GameStatus = "Waiting" | "Shuffling" | "Dealing" | "MyTurn" | "OthersTurn" | "Win" | "Loss" | "Draw";

// Deal the cards - each player posts the encrypted keys for the cards the other player is supposed 
// to draw
export async function deal(imFirst: boolean, count: number) {
    const queue = store.getState().queue.value!;

    await store.dispatch(updateGameStatus("Dealing"));

    // This keeps track of cards the *other* player is supposed to draw, so we can hand them the
    // keys - first player draws first 7, second player draws next 7
    const cards = new Array(count).fill(0).map((_, i) => imFirst ? i + count : i);
    const keys = cards.map((card) => store.getState().deck.value!.getKey(card)!);

    await sm.run(sm.sequence([
        sm.local(async (queue: IQueue<Action>, context: RootStore) => {
            await queue.enqueue({ 
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
        }), 2)
    ]), queue, store);
}

// Draw a card - this is a multi-step process: we request a card draw providing the card index and
// the other player should respond with the card index and the key used to encrypt the card
export async function drawCard() {
    // Get a reference to the action queue from the store
    const queue = store.getState().queue.value!;

    await store.dispatch(updateGameStatus("Waiting"));

    await sm.run([
        sm.local(async (queue: IQueue<Action>, context: RootStore) => {
            await queue.enqueue({ 
                clientId: context.getState().id.value, 
                type: "DrawRequest",
                cardIndex: context.getState().deck.value!.getDrawIndex() });
        }),
        sm.transition((action: DrawRequestAction) => {
            // Our own draw request, no need to do anything
            // This should be sequenced before the response, as other client needs to
            // receive it before it responds
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

    await store.dispatch(updateGameStatus("OthersTurn"));
    await waitForOpponent();
}

// Discard a card - this is a single-step process - we provide the card index and the key used to
// encrypt it; the other player already has their own key
export async function discardCard(index: number) {
    // Get a reference to the action queue from the store
    const queue = store.getState().queue.value!;

    await store.dispatch(updateGameStatus("Waiting"));

    await sm.run([
        sm.local(async (queue: IQueue<Action>, context: RootStore) => {
            await queue.enqueue({
                clientId: context.getState().id.value, 
                type: "DiscardRequest",
                cardIndex: index,
                key: context.getState().deck.value!.getKeyFromHand(index)});
        }),
        sm.transition(async (action: DiscardRequestAction, context: RootStore) => {
            // Our own discard request, update the deck
            if (action.type !== "DiscardRequest") {
                throw new Error("Invalid action type");
            }

            await context.getState().deck.value!.myDiscard(action.cardIndex);
        }),
    ], queue, store);

    // If we discarded the last card, we win
    if (store.getState().deckViewModel.value.myCards.length === 0) {
        await store.dispatch(updateGameStatus("Win"));
    // Otherwise it's the other player's turn
    } else {
        await store.dispatch(updateGameStatus("OthersTurn"));
        await waitForOpponent();
    }
}

// Let the other player know we can't move
export async function cantMove() {
    const queue = store.getState().queue.value!;

    await queue.enqueue({ 
        clientId: store.getState().id.value, 
        type: "CantMove" });

    await store.dispatch(updateGameStatus("Loss"));
}

// Wait for the opponent to take an action and respond based on that
export async function waitForOpponent() {
    const queue = store.getState().queue.value!;

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
            await store.dispatch(updateGameStatus("MyTurn"));
            break;
        case "DiscardRequest":
            // Here is where we would check if the other player is cheating - if the
            // card they are playing doesn't match the top of the discard pile by suit or
            // color, it's an illegal move

            // No need to respond to a discard request, just update state
            await store.getState().deck.value!.othersDiscard(othersAction.cardIndex, othersAction.key);

            // If other player discarded all cards, they win
            if (store.getState().deckViewModel.value.othersHand === 0) {
                await store.dispatch(updateGameStatus("Loss"));
            // Otherwise it's our turn if we can move
            } else if (store.getState().deck.value?.canIMove()) {
                await store.dispatch(updateGameStatus("MyTurn"));
            // If we can't move, we lose
            } else {
                await cantMove();
            }


            break;
        case "CantMove":
            // Other player can't move, we win
            await store.dispatch(updateGameStatus("Win"));
            break;
        }
}
