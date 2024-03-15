# Rock-paper-scissors game demo

This is a simple rock-paper-scissors game built using the toolkit, using React
for the UI and Redux for state management.

## Running

Run with `npm run start`.

This should start a local Fluid server and the React app. Alternately you can
start the server with `npm run start:server` and the client with
`npm run start:client`.

When you open a browser and navigate to the app (default is `localhost:3000`),
once the client connect to the Fluid server, you should see a GUID appended to
the URL. Copy paste the URL, including the GUID, in another tab to launch a
second client and have it connect to the second sessions.

Once clients connects, they should show the other player ID and be able to
click on the buttons. Once both players clicked on rock or paper or scissors,
the winner is determined and a new round starts.

## Implementation notes

The logic of the game is implemented in `model.ts`. This includes the `Actions`
the game defines and the state machine for playing a round.

Game state is stored in Redux. This is defined in `store.ts`.

`buttonsView.tsx` is the React component for rendering the 3 buttons. `mainView`
is the main view of the game.

`index.tsx` kicks things off by establishing Fluid connection then setting up
the game, while also mounting the root React component.
