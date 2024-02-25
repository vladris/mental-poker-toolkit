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

## Roadmap

We implemented a zero-trust discard game over Fluid Framework over a couple of
hackathons. We will be refactoring/cleaning up the code and open sourcing it as
packages in this repo, including:

- [x] Cryptography: SRA commutative symmetric encryption algorithm and digital
  signing.
- [x] An [append-only distributed data structure](https://github.com/vladris/fluid-ledger)
  for Fluid Framework.
- [x] An abstraction for client communication for games and a Fluid
  implementation for it.
- [x] A decorator providing message signing and authentication for client
  communication.
- [x] An async queue abstraction over the transport layer.
- [x] A state machine for modeling games.
- [ ] Primitives for common game actions like handling a deck of cards.
- [ ] Documentation and recipes for various games.
