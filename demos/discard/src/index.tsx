import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { getLedger } from "@mental-poker-toolkit/demo-transport";
import { establishTurnOrder, randomClientId, shuffle, upgradeTransport } from "@mental-poker-toolkit/primitives";
import { Action, deal, waitForOpponent } from "./model";
import { MainView } from "./mainView";
import { store, updateDeck, updateGameStatus, updateId, updateOtherPlayer, updateQueue } from "./store";
import { Deck, getDeck } from "./deck";

// Initialization - we first connect to the Fluid session
getLedger<Action>().then(async (ledger) => {
    // Generate a random client ID
    const id = randomClientId();

    // Store client ID
    await store.dispatch(updateId(id));

    // Once other player joins, upgrade transport to one with signature verification
    const queue = await upgradeTransport(2, id, ledger);

    // Store action queue
    await store.dispatch(updateQueue(queue));

    // Extract other player's id and store it
    for (const action of ledger.getActions()) {
        if (action.clientId !== id) {
            await store.dispatch(updateOtherPlayer(action.clientId));
            break;
        }
    }

    // Establish turn order and shared prime
    const [sharedPrime, turnOrder] = await establishTurnOrder(2, id, queue);

    await store.dispatch(updateGameStatus("Shuffling"));

    // Shuffle - this example uses a smaller key size to makes things faster but less secure
    const [keys, deck] = await shuffle(id, turnOrder, sharedPrime, getDeck(), queue, 64);
 
    const imFirst = turnOrder[0] === id;

    // Store deck
    await store.dispatch(updateDeck(new Deck(deck, keys, store)));

    // Deal cards
    await deal(imFirst, 5);

    // Update game status
    await store.dispatch(updateGameStatus(imFirst ? "MyTurn" : "OthersTurn"));

    if (!imFirst) {
        await waitForOpponent();
    }
});

// Set up React
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
    <Provider store={store}>
        <MainView />
    </Provider>
);
