// Transport interface
export declare interface ITransport<T> {
    // Get all the actions that have been posted so far
    getActions(): IterableIterator<T>;

    // Post an action
    postAction(value: T): Promise<void>;

    // Event emitter
    once(event: "actionPosted", listener: (value: T) => void): this;
    on(event: "actionPosted", listener: (value: T) => void): this;
    off(event: "actionPosted", listener: (value: T) => void): this;
}
