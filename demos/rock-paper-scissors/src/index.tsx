import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { getLedger } from "@mental-poker-toolkit/demo-transport";
import { randomClientId, upgradeTransport } from "@mental-poker-toolkit/primitives";
import { Action } from "./model";
import { MainView } from "./mainView";
import { store, updateGameStatus, updateId, updateOtherPlayer, updateTransport } from "./store";

// Initialization - we first connect to the Fluid session
getLedger<Action>().then((ledger) => {
    // Generate a random client ID
    const id = randomClientId();

    // Store client ID and transport
    store.dispatch(updateId(id));
    store.dispatch(updateTransport(ledger));

    // Once other player joins, upgrade transport to one with signature verification
    upgradeTransport(2, id, ledger).then((ledger) => {
        // Replace stored transport with the upgraded one
        store.dispatch(updateTransport(ledger));

        // Extract other player's id and store it
        for (const action of ledger.getActions()) {
            if (action.clientId !== id) {
                store.dispatch(updateOtherPlayer(action.clientId));
                break;
            }
        }

        // Now we can start playing
        store.dispatch(updateGameStatus("Ready"));
    });

    // Set up React
    const root = ReactDOM.createRoot(document.getElementById("root")!);
    root.render(
        <Provider store={store}>
            <MainView />
        </Provider>
    );
});
