// Transport interface
export declare interface ITransport<T> {
    postAction(value: T): Promise<void>;

    on(event: "actionPosted", listener: (value: T) => void): this;
    off(event: "actionPosted", listener: (value: T) => void): this;
}
