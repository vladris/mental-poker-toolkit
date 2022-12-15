// TODO: refactor this into multiple files
export type ClientId = string;

export declare interface ITransport<T> {
    postAction(value: T): Promise<void>;

    on(event: "actionPosted", listener: (value: T) => void): this;
}
