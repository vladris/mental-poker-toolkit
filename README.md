# Mental Poker Toolkit

![CI status](https://github.com/vladris/mental-poker-toolkit/actions/workflows/ci.yml/badge.svg)

A Mental Poker toolkit for building games in zero-trust environments with native
support for [Fluid Framework](https://fluidframework.com/).

This started as a hackathon project for modeling a game where players need to
maintain private state over a public channel (Fluid Framework). More details
[here](https://vladris.com/blog/2021/12/11/mental-poker.html).

Implementing this type of games in a zero-trust environment is known as *Mental
Poker* (original paper is [here](https://people.csail.mit.edu/rivest/pubs/SRA81.pdf)).

## Games in a zero-trust environment

We use a broad definition of *game*. A game can be a card game, but it can also
be a lottery, an auction, a blind vote etc. A game is any activity involving
multiple people (players) where some information might have to be kept private
and players compete for some payoff.

By *zero-trust environment* we mean an environment without a trusted 3rd party.
For example, if we have a trusted 3rd party, like a service brokering the game,
we can trust the service to shuffle a deck of cards and hand them to each
player. Without a trusted 3rd party, we need to shuffle the deck as described
in the Mental Poker paper linked above. We also can't trust other players, as
players compete for a payoff so we need to eliminate cheating through
cryptography. We achieve all of this by communicated over a public channel
where all players view all shared state.

## Toolkit

The toolkit provides a set of packages you can use to build this type of game.
It has everything needed "out-of-the-box", but you can swap things as needed
with other implementation.

The toolkit contains the following packages:

* `types` - Type package containing common type definitions. This ensures other
  toolkit packages don't depend on each other.
* `fluid-client` - A client that provides transport over Fluid Framework.
* `signed-transport` - A decorator for transport that adds signing and
  signature verification to messages.
* `action-queue` - An async queue that sits on top of a transport and provides
  an easy to use async interface.
* `state-machine` - A state machine for running games as sequences of steps.
* `primitives` - This is a utility package that builds on top of the other ones
  to provide some common functionality like client key exchange, upgrading
  a transport to a signed transport, shuffling a deck of cards etc.

## Demos

This repo also contains demo applications:

* `transport` - This is a simple demo setting up a Fluid container connecting
  with a local relay service and returning a transport.
* `rock-paper-scissors` - This demonstrates a cryptographically secure game of
  rock-paper-scissors, where both clients post their encrypted selection, then
  share their encryption keys to determine the winner.
* `discard` - This demo implements a simple discard game where players take
  turns discarding and drawing until either a player has not cards left or
  a player can't move (neither discard nor draw).

## Documentation

See the detailed documentation [here](https://vladris.com/mental-poker-toolkit/).
Also checkout the `README` files of each demo and [these articles](https://vladris.com/writings/#mental-poker). The code has plenty of comments explaining what is going on.
