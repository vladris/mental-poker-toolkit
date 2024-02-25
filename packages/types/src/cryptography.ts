import { ClientId } from "./base";

// Keys are represented as strings
export type Key = string;

// Public/private key pair
export type PublicPrivateKeyPair = {
    publicKey: Key;
    privateKey: Key;
};

// Signed type
export type Signed<T> = T & { clientId?: ClientId; signature?: string };

// Key store contains a map of client IDs to public keys
export type KeyStore = Map<ClientId, Key>;

// Client key contains client ID and private key
export type ClientKey = { clientId: ClientId; privateKey: Key };

// SRA key pair consists of an agreed-upon large prime and enc and dec
// primes derived from it (private) and used to encrypt/decrypt
export type SRAKeyPair = {
    prime: bigint;
    enc: bigint;
    dec: bigint;
};
