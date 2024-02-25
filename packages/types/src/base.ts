// Client ID
export type ClientId = string;

// Base Action for modeling games
export type BaseAction = {
    clientId: ClientId;
    type: unknown;
};
