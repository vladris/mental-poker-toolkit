import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { getLedger } from "@mental-poker-toolkit/demo-transport";
import { randomClientId, upgradeTransport } from "@mental-poker-toolkit/primitives";
import { Action } from "./model";
import { MainView } from "./mainView";
import { store, updateGameStatus, updateId, updateOtherPlayer, updateQueue } from "./store";

// Initialization - we first connect to the Fluid session
getLedger<Action>().then(async (ledger) => {
    // Generate a random client ID
    const id = randomClientId();

    // Store client ID
    await store.dispatch(updateId(id));

    // Once other player joins, upgrade transport to one with signature verification
    const queue = await upgradeTransport(2, id, ledger);
    
    await store.dispatch(updateQueue(queue));

    // Extract other player's id and store it
    for (const action of ledger.getActions()) {
        if (action.clientId !== id) {
            store.dispatch(updateOtherPlayer(action.clientId));
            break;
        }
    }

    // Now we can start playing
    await store.dispatch(updateGameStatus("Ready"));
});

// Set up React
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
    <Provider store={store}>
        <MainView />
    </Provider>
);
