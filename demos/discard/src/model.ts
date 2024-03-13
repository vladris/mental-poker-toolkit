import { ClientId, IQueue, SRAKeyPair } from "@mental-poker-toolkit/types";
import { StateMachine as sm } from "@mental-poker-toolkit/state-machine";
import { RootStore, store, updateDeck, updateGameStatus } from "./store";

export type DrawRequestAction = {
    clientId: ClientId;
    type: "DrawRequest";
    cardIndex: number;
}

export type DrawResponseAction = {
    clientId: ClientId;
    type: "DrawResponse";
    cardIndex: number;
    key: SRAKeyPair;
}

export type DiscardRequestAction = {
    clientId: ClientId;
    type: "DiscardRequest";
    cardIndex: number;
    key: SRAKeyPair;
}

export type PassTurnAction = {
    clientId: ClientId;
    type: "PassTurn";
}

export type Action = DrawRequestAction | DrawResponseAction | DiscardRequestAction | PassTurnAction;

export type GameStatus = "Waiting" | "Shuffling" | "MyTurn" | "OthersTurn" | "Win" | "Loss" | "Draw";

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
                cardIndex: context.getState().deck.value!.draw() });
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

            context.getState().deck.value!.putInMyHand(action.cardIndex, action.key);
            
            // Trigger an update
            await context.dispatch(updateDeck(context.getState().deck.value!));
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

            context.getState().deck.value!.myDiscard(action.cardIndex);

            // Trigger an update
            await context.dispatch(updateDeck(context.getState().deck.value!));
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
        // Deque the other player's action to decide next steps
        const othersAction = await queue.dequeue();

        switch (othersAction.type) {
            case "DrawRequest":
                await sm.run([
                    sm.local(async (queue: IQueue<Action>, context: RootStore) => {
                        // Ensure other player is drawing from the top of the deck
                        if (othersAction.cardIndex !== store.getState().deck.value!.draw()) {
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

                        context.getState().deck.value!.putInOthersHand(action.cardIndex);
                        
                        await context.dispatch(updateDeck(context.getState().deck.value!));
                    })], queue, store);
                break;
            case "DiscardRequest":
                // No need to respond to a discard request, just update state
                store.getState().deck.value!.othersDiscard(othersAction.cardIndex, othersAction.key); 
                await store.dispatch(updateDeck(store.getState().deck.value!));
                break
            case "PassTurn":
                // The other player passed the turn
                await store.dispatch(updateGameStatus("MyTurn"));
                return;
        }
    }
}