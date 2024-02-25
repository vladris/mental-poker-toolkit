import { BaseAction } from "./base";

// Async queue interface
export interface IQueue<T extends BaseAction> {
    // Enqueue value
    enqueue(value: T): Promise<void>;

    // Dequeue value asynchronously
    dequeue(): Promise<T>;
}
