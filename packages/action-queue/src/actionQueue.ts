import { BaseAction, IQueue, ITransport } from "@mental-poker-toolkit/types";

// An action queue provides an additional abstraction over the transport
// as transport uses a mix of available data and events for incoming data.
// The queue provides a more consistent interface for the client to use,
// where dequeues are promises which resolve as data becomes available.
export class ActionQueue<T extends BaseAction> implements IQueue<T> {
    private queue: T[] = [];

    // Create an ActionQueue from a transport
    constructor(
        private readonly transport: ITransport<T>,
        preseed: boolean = false
    ) {
        // On action posted, add it to the queue
        transport.on("actionPosted", (value) => {
            this.queue.push(value);
        });

        // Seed the queue with existing actions if requested
        if (preseed) {
            for (const value of transport.getActions()) {
                this.queue.push(value);
            }
        }
    }

    // Enqueue an action
    async enqueue(value: T) {
        // This just posts the action to the transport, respecting
        // the Fluid ordering semantics
        await this.transport.postAction(value);
    }

    // Dequeue an action
    async dequeue(): Promise<T> {
        // If there's something in the queue, return it right away
        const result = this.queue.shift();
        if (result) {
            return Promise.resolve(result);
        }

        // Otherwise, wait for an action to be posted
        return new Promise<T>((resolve) => {
            this.transport.once("actionPosted", async () => {
                // We recursively call dequeue in case we have multiple
                // callers waiting to dequeue
                resolve(await this.dequeue());
            });
        });
    }
}
