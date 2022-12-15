// TODO: refactor this into multiple files

// Client ID
export type ClientId = string;

// Transport interface
export declare interface ITransport<T> {
    postAction(value: T): Promise<void>;

    on(event: "actionPosted", listener: (value: T) => void): this;
}
