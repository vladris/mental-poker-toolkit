import { ClientId } from "./primitives";

// Base Action for modeling games
export type BaseAction = {
    clientId: ClientId;
    type: unknown;
};
