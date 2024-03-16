# Zero trust and limitations

If we can rely on a trusted 3rd party, modeling secure games is easy. Assuming
we can't, we use Mental Poker. But it's important to discuss the limitations
and potential attack vectors Mental Poker can't address.

## "Flip the table"

Since we don't have a trusted arbiter of the game, all players need to agree
on the rules of the game. As long as the game is player according to the rules,
everything is great. But if one of the player makes an illegal move - *illegal*
according to the rules of the game - another player doesn't really have a way
to appeal it - since there is no trusted arbiter, the only thing we can do in
this setup is "flip the table" - consider the game invalid.

With Mental Poker, we *should* be able to tell when an illegal move happens,
but we can't do much once we observe it.

Takeaway: it's very important to perform client-side validations for everything
and never assume the other player is respecting the rules of the game.

## Spoofing

A player could pretend to be another player and act on their behalf. This is
less of a problem in two-player games, but more so if multiple players are
involved. Imagine a 5 player card game and, while it's the 2nd player's turn,
the 5th player takes a turn and sets their `clientId` to match the 2nd
player's.

This is the main reason the toolkit provides a *signed transport*. This is not
a new problem - how do you know the website you *believe* you are visiting is
actually the authentic website and not something a malicious man-in-the-middle
injected? Certificates and HTTPS aim to address this. Similarly, we use
asymmetric cryptography to mitigate spoofing: clients generate a public/private
key pair and share their `clientId` and public key. Afterwards, all messages
are signed with the private key, so any other client in the session can
validate the signature using the public key.

Of course, there is no good mitigation for players colluding and sharing their
private keys. See below.

## Collusion

If we're playing against multiple other players, if they use a separate channel
to communicate, they would gain an advantage: eg. showing each other's hands.
There is no mitigation for playing against colluding opponents. Mental Poker
provides a secure protocol for playing across an open channel, but there is no
way to mitigate against other players sharing information out-of-band.

Takeaway: need to consider such attacks, but this is not a limitation of Mental
Poker per-se - even with a trusted 3rd party service, say playing Texas Hold'em,
two players can IM each other their hands etc.
