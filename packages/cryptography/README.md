# @mental-poker-toolkit/cryptography

Provides cryptography used in Mental Poker.

> **Warning**
>
> This library deals with cryptography and has not undergone a thorough code
> review. It is not recommended to play Mental Poker for money at this time.

`bigIntMath.ts` implements some math functions required by cryptography using
BigInts (since JavaScript's out-of-the-box math only works with large numbers).
This includes generating large primes (trial & error with Miller-Rabin primality
test).

`SRA.ts` implements the SRA (Shamir-Rivest-Adleman) commutative encryption
algorithm. Note this is *not* RSA, though it has the same authors. Most
symmetric encryption algorithms are non-commutative, but Mental Poker requires
a commutative algorithm.

`signing.ts` wraps digital signing using `crypto.subtle`.
