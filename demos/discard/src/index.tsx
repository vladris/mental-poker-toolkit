import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { getLedger } from "@mental-poker-toolkit/demo-transport";
import { establishTurnOrder, randomClientId, shuffle, upgradeTransport } from "@mental-poker-toolkit/primitives";
import { Action, getDeck } from "./model";
import { MainView } from "./mainView";
import { store, updateId, updateOtherPlayer, updateQueue } from "./store";

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
            store.dispatch(updateOtherPlayer(action.clientId));
            break;
        }
    }

    console.log("Establishing turn order");

    const [sharedPrime, turnOrder] = await establishTurnOrder(2, id, queue);

    console.log("Shuffling deck");

    // This example uses a smaller key size to makes things faster but less secure
    const [keys, deck] = await shuffle(id, turnOrder, sharedPrime, getDeck(), queue, 64);

    console.log(keys);
    console.log(deck);
});

// Set up React
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
    <Provider store={store}>
        <MainView />
    </Provider>
);
