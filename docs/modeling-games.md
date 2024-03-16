# Modeling games

We model games as a sequence of *actions*.

## A simple example

For example, here is one way to model a game of rock-paper-scissors (this is a
demo in this repo):

* `PlayAction` - each player selects one of *rock*, *paper*, or *scissors*,
encrypts the selection, and broadcasts it.
* `RevealAction` - each player broadcasts the key they used to encrypt their
selection.

So a game consists of 4 actions: `PlayAction` (from one player), `PlayAction`
(from the other player), `RevealAction` (from one player), `RevealAction`
(from the other player).

Note the order of plays and reveals doesn't matter, as long as no
`RevealAction` comes before the last `PlayAction`.

## Actions

One of the most basic types defined in the `types` package is `BaseAction`.
This represents the minimal properties we expect an action to have: a
`clientId` and a `type`.

The `clientId` tells us which client originated the action, the `type` helps
us disambiguate between the different actions that a game needs. A lot of the
core types and interfaces are generic, with the constraint
`T extends BaseAction`.

An interesting problem we have to solve is that each game has its own specific
actions, but we want to provide some common infrastructure for any game. We do
this by modeling game-specific actions as their own subtypes of `BaseAction`,
then combining them into an `Action`. Going back to our rock-paper-scissors
example, we have `type Action = PlayAction | RevealAction`. Then we can
instantiate our types as, for example, `ActionQueue<Action>`.

## State machine for rock-paper-scissors

We defined our `PlayAction` and `RevealAction`. The game of rock-paper-scissors
state machine is:

* Enqueue a `PlayAction` - Our encrypted selection.
* Expect two `PlayAction`s coming from the server - our own action, which we can
  ignore, and the other player's action, for which we need to store their
  encrypted selection.
* Enqueue a `RevealAction` - Our encryption key.
* Expect two `RevealAction`s coming from the server - our own action, which we
  can ignore, and the other player's action, which has the encryption key so
  we can decrypt their pick.
* We can now determine who won the game.

> [!NOTE]
> We are following the Fluid Framework design in all examples, assuming no
> message we sent was seen by other players until we receive it back ourselves
> over the transport.
>
> That means for every action we take, we need corresponding code to expect
> it coming back over the transport (being dequeued). Since our `BaseAction`
> requires a `clientId`, we can easily tell our own incoming actions from
> actions coming from other players.

See [State Machine](./state-machine.md) for details on the state machine
implementation.

## More complex examples

### Shuffling cards

Shuffling cards in Mental Poker is a more complex example:

* Alice takes a deck of cards (an array), shuffles the deck, generates
  a secret key $K_A$, and encrypts each card with $K_A$.
* Alice hands the shuffled and encrypted deck to Bob. At this point,
  Bob doesn't know what order the cards are in (since Alice encrypted
  the cards in the shuffled deck).
* Bob takes the deck, shuffles it, generates a secret key $K_B$, and
  encrypts each card with $K_B$.
* Bob hands the deck to Alice. At this point, neither Alice nor Bob
  know what order the cards are in. Alice got the deck back reshuffled
  and re-encrypted by Bob, so she no longer knows where each card
  ended up. Bob reshuffled an encrypted deck, so he also doesn't know
  where each card is.

To reveal a card, Alice and Bob exchange keys.

The shuffling algorithm is implemented in the `primitives` package. It defines
two `Actions`, `ShuffleAction1` and `ShuffleAction2` for each step, and the
state machine to perform the shuffle.

### Drawing and discarding cards

Considering the shuffling algorithm above, we start the game with a deck
encrypted such that neither player can "see" any of the cards. They need
the corresponding key from the other player in order to decrypt the card.

If Alice wants to draw a card from the top of the draw pile. This card,
$K_1$, is double-encrypted with Alice's key ($K_{A1}$) and Bob's ($K_{B1}$).

* Alice asks Bob for the key to the card on top of the draw pile ($K_1$).
* Bob validates this is a valid game move and, if so, sends Alice $K_{B1}$.
* Alice can now decrypt and "see" the card (Bob still can't see it as he
  doesn't have Alice's key $K_{A1}$).

Even drawing a card involves several steps. It means we need to ask the other
player for a key, and the other player needs to send it.

This is where we would also run validation logic based on the game semantics:
*is the other player allowed to draw that card?* In a zero-trust environment,
we need to cover all our bases. See [Implications of zero-trust](./zero-trust.md).

## Discard

The discard game demo is a good example of a more complex games with several
actions - dealing, discarding a card, drawing a card etc. You can see how we
model the game based on who's turn is it:

* If it's our turn, we use the UI to trigger a model function which runs a
  state machine to transact, for example, a card draw.
* If it's the other player's turn, we check what `Action` they send and, based
  on its type, we run another state machine to transact, for example, allowing
  them to draw a card.
