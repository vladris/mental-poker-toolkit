import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { getLedger } from "@mental-poker-toolkit/demo-transport";
import { randomClientId, upgradeTransport } from "@mental-poker-toolkit/primitives";
import { Action } from "./model";
import { MainView } from "./mainView";
import { store, updateGameStatus, updateId, updateOtherPlayer, updateTransport } from "./store";

// Initialization - we first connect to the Fluid session
getLedger<Action>().then((ledger) => {
    // Generate a random client ID and store transport
    store.dispatch(updateId(randomClientId()));
    store.dispatch(updateTransport(ledger));

    // Listener for other player
    const setOtherPlayer = (action: Action) => {
        // If the action was posted by us, return
        if (action.clientId === store.getState().id.value) {
            return;
        }

        // Otherwise we got the second player, update store with its client ID
        store.dispatch(updateOtherPlayer(action.clientId));

        // Stop listening
        store.getState().transport.value?.off("actionPosted", setOtherPlayer);
    }
    store.getState().transport.value?.on("actionPosted", setOtherPlayer);

    // Once other player joins, upgrade transport to one with signature verification
    upgradeTransport(store.getState().id.value, ledger).then((ledger) => {
        // Replace stored transport with the upgraded one
        store.dispatch(updateTransport(ledger));

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
