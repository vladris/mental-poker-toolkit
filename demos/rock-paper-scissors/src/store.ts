import { configureStore, createAction, createReducer } from '@reduxjs/toolkit'
import { Action, GameStatus, PlayValue } from './model'
import { ITransport } from '@mental-poker-toolkit/types';

/*
Game state consists of the following:
id          - Our ID
otherPlayer - Other player ID
transport   - ITransport interface used for communication
gameStatus  - Current game status
myPlay      - Our selection of Rock/Paper/Scissors (possibly encrypted)
theirPlay   - Their selection of Rock/Paper/Scissors (possibly encrypted)
*/


// Update actions
export const updateId = createAction<string>('id/update');
export const updateOtherPlayer = createAction<string>('otherPlayer/update');
export const updateTransport = createAction<ITransport<Action>>('transport/update');
export const updateGameStatus = createAction<GameStatus>('gameStatus/update');
export const updateMyPlay = createAction<PlayValue>('myPlay/update');
export const updateTheirPlay = createAction<PlayValue>('theirPlay/update');

// Helper function to create a reducer with an update action
function makeUpdateReducer<T>(initialValue: T, updateAction: ReturnType<typeof createAction>) {
    return createReducer({ value: initialValue }, (builder) => {
        builder.addCase(updateAction, (state, action) => { state.value = action.payload })
    })
}

// Set up store
export const store = configureStore({
  reducer: {
    id: makeUpdateReducer("", updateId),
    otherPlayer: makeUpdateReducer("Not joined", updateOtherPlayer),
    transport: makeUpdateReducer<ITransport<Action> | undefined>(undefined, updateTransport),
    myPlay: makeUpdateReducer<PlayValue>({ type: "None" }, updateMyPlay),
    theirPlay: makeUpdateReducer<PlayValue>({ type: "None" }, updateTheirPlay),
    gameStatus: makeUpdateReducer("Waiting", updateGameStatus)
  },
  middleware: (getDefaultMiddleware) =>
    // Fluid ledger is non-serializable but we don't need to persis anyway so ignore this check
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>;
