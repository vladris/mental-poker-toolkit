export interface ITransport<T> {
    postAction(value: T): void;

    on(event: "actionPosted", listener: (value: T) => void): this;
}
