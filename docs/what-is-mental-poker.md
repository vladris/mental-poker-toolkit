# What is Mental Poker?

This project started as a hackathon project for modeling a game where players
need to maintain private state over a public channel (Fluid Framework). More
details [here](https://vladris.com/blog/2021/12/11/mental-poker.html).

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

## More resources

See [these articles](https://vladris.com/writings/#mental-poker) for more
details on Mental Poker (covering some of the implementations in this project).

A short talk on Mental Poker: <https://www.youtube.com/watch?v=F1gPTXAllxY>.
