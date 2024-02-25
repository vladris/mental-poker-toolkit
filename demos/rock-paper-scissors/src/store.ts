import { configureStore, createAction, createReducer } from "@reduxjs/toolkit";
import { Action, GameStatus, PlayValue } from "./model";
import { IQueue } from "@mental-poker-toolkit/types";

/*
Game state consists of the following:
id          - Our ID
otherPlayer - Other player ID
queue       - Action queue
gameStatus  - Current game status
myPlay      - Our selection of Rock/Paper/Scissors (possibly encrypted)
theirPlay   - Their selection of Rock/Paper/Scissors (possibly encrypted)
*/

// Update actions
export const updateId = createAction<string>("id/update");
export const updateOtherPlayer = createAction<string>("otherPlayer/update");
export const updateQueue = createAction<IQueue<Action>>("queue/update");
export const updateGameStatus = createAction<GameStatus>("gameStatus/update");
export const updateMyPlay = createAction<PlayValue>("myPlay/update");
export const updateTheirPlay = createAction<PlayValue>("theirPlay/update");

// Helper function to create a reducer with an update action
function makeUpdateReducer<T>(
    initialValue: T,
    updateAction: ReturnType<typeof createAction>
) {
    return createReducer({ value: initialValue }, (builder) => {
        builder.addCase(updateAction, (state, action) => {
            state.value = action.payload;
        });
    });
}

// Set up store
export const store = configureStore({
    reducer: {
        id: makeUpdateReducer("", updateId),
        otherPlayer: makeUpdateReducer("Not joined", updateOtherPlayer),
        queue: makeUpdateReducer<IQueue<Action> | undefined>(
            undefined,
            updateQueue
        ),
        myPlay: makeUpdateReducer<PlayValue>(
            { type: "None", value: undefined },
            updateMyPlay
        ),
        theirPlay: makeUpdateReducer<PlayValue>(
            { type: "None", value: undefined },
            updateTheirPlay
        ),
        gameStatus: makeUpdateReducer("Waiting", updateGameStatus),
    },
    middleware: (getDefaultMiddleware) =>
        // Fluid ledger and abstractions over it are non-serializable but we
        // don't need to persist anyway so ignore this check
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type RootStore = typeof store;
