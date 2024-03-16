# Discard game demo

This is a simple discard game built using the toolkit, using React for the UI
and Redux for state management.

## Running

Run with `npm run start`.

This should start a local Fluid server and the React app. Alternately you can
start the server with `npm run start:server` and the client with
`npm run start:client`.

When you open a browser and navigate to the app (default is `localhost:3000`),
once the client connect to the Fluid server, you should see a GUID appended to
the URL. Copy paste the URL, including the GUID, in another tab to launch a
second client and have it connect to the second sessions.

Once clients connects, they should show the other player ID and start shuffling
the cards. This takes a few seconds since we need to generate a bunch of large
primes. Once the deck is shuffle, each client is dealt cards and you should be
able to start playing.

Players take turns discarding cards matching the value or suit of the card on
top of the discard pile. If a player can't discard, they must draw a card from
the draw pile. If a player discards the last card in their hand, they win. If
a player can't discard anything and the draw pile is empty, they lose.

The game ends here - to keep the example as simple as possible, there is no
implementation for restarting the game, so you would have to connect 2 other
clients to play again.

## Implementation notes

We have a deck of cards with logic implemented in `deck.ts`. Whenever the state
of the deck changes, we update the `defaultDeckViewModel`, to trigger UI
updates.

The logic of the game is implemented in `model.ts`. This includes the `Actions`
the game defines and operations (for example dealing cards, drawing a card,
discarding a card, or responding to incoming messages from the other player
etc.)

Game state is stored in Redux, including the deck view-model. This is defined
in `store.ts`.

`cardView.tsx` is the React component for rendering a card. `handView.tsx`
represents a hand of cards. `mainView` is the main view of the game, including
the backs of the other player's cards, back of draw pile, discard pile, and
our own hand.

`index.tsx` kicks things off by establishing Fluid connection then setting up
the game, while also mounting the root React component.

To keep the code simple and easy to read, we are not handling cases like
connection drops etc.

We are also not validating the other player's move, though this would be easy
to add and, in fact, for a real-world implementation, would be mandatory. There
is a comment in the code where validation should go in. A malicious user could
discard any card and since we're not validating whether their move was legal,
they could "trick" us. The reason this is not implemented is to keep the
example simple (thought PRs are welcomed if you want to give it a stab).
