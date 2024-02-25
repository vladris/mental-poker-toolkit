import { EventEmitter } from "events";
import { describe, expect, test } from "@jest/globals";
import { ClientId, ITransport } from "@mental-poker-toolkit/types";
import { ActionQueue } from "../actionQueue";

class MockTransport<T> extends EventEmitter implements ITransport<T> {
    private actions: T[] = [];

    addAction(value: T) {
        this.actions.push(value);
        this.emit("actionPosted", value);
    }

    *getActions(): IterableIterator<T> {
        for (const action of this.actions) {
            yield action;
        }
    }

    postAction(value: T): Promise<void> {
        this.addAction(value);
        return Promise.resolve();
    }
}

type TestAction = {
    clientId: ClientId;
    type: "TestAction";
    value: number;
}

function box(value: number): TestAction {
    return { clientId: "", type: "TestAction", value };
}

function unbox(action: TestAction): number {
    return action.value;
}

describe("ActionQueue tests", () => {
    test("Preseed enqueues existing events", async () => {
        const transport = new MockTransport<TestAction>();
        transport.addAction(box(1));
        transport.addAction(box(2));
        transport.addAction(box(3));
        
        const queue = new ActionQueue(transport, true);
        transport.addAction(box(4));

        // Should dequeue all actions
        expect(unbox(await queue.dequeue())).toBe(1);
        expect(unbox(await queue.dequeue())).toBe(2);
        expect(unbox(await queue.dequeue())).toBe(3);
        expect(unbox(await queue.dequeue())).toBe(4);
    });

    test("Existing actions are discarded without preseed", async () => {
        const transport = new MockTransport<TestAction>();
        transport.addAction(box(1));
        transport.addAction(box(2));
        transport.addAction(box(3));
        
        const queue = new ActionQueue(transport);
        transport.addAction(box(4));

        // Should only see the action posted after creating the queue
        expect(unbox(await queue.dequeue())).toBe(4);
    });

    test("Correct ordering of multiple waiting dequeues", done => {
        const transport = new MockTransport<TestAction>();
        const queue = new ActionQueue(transport);

        // Promises should resolve in order
        queue.dequeue().then((act) => expect(unbox(act)).toBe(1));
        queue.dequeue().then((act) => expect(unbox(act)).toBe(2));
        queue.dequeue().then((act) => { 
            expect(unbox(act)).toBe(3);
            done();
        });

        // Start queueing values that will resolve above promises
        queue.enqueue(box(1));
        queue.enqueue(box(2));
        queue.enqueue(box(3));
    });
});
