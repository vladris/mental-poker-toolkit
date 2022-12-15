import { Key } from "./signing";
import { ClientId } from "@mental-poker-toolkit/types";

// Key store contains a map of client IDs to public keys
export type KeyStore = Map<ClientId, Key>;

// Client key contains client ID and private key
export type ClientKey = { clientId: ClientId; privateKey: Key };
