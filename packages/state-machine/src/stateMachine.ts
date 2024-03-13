import {
    BaseAction,
    IQueue,
} from "@mental-poker-toolkit/types";

// State machine transition takes an action and a context and return true if the transition is valid
export type Transition<TAction extends BaseAction, TContext> = (
    action: TAction,
    context: TContext
) => void | Promise<void>;

// LocalAction is a special action that is not sent over the transport 
export type LocalAction = { clientId: string, type: "LocalAction" }

// Local transition is a function that will be called right away (rather than waiting for transport)
export type LocalTransition<TAction extends BaseAction, TContext> = (actionQueue: IQueue<TAction>, context: TContext) => void | Promise<void>; 

// A runnable transition can be directly invoked
export type RunnableTransition<TContext> = (actionQueue: IQueue<BaseAction>, context: TContext) => Promise<void>;

export namespace StateMachine {
    export function local<TAction extends BaseAction, TContext>(
        transition: LocalTransition<TAction, TContext>): RunnableTransition<TContext> {
        return async (queue: IQueue<BaseAction>, context: TContext) => await Promise.resolve(transition(queue as IQueue<TAction>, context));
    }

    export function transition<TAction extends BaseAction, TContext>(
        transition: Transition<TAction, TContext>): RunnableTransition<TContext> {
        return async (queue: IQueue<BaseAction>, context: TContext) => {
            const action = await queue.dequeue();
            await Promise.resolve(transition(action as TAction, context));
        }
    }

    export function repeat<TContext>(
        transition: RunnableTransition<TContext>,
        times: number): RunnableTransition<TContext>[] {
        return Array(times).fill(transition);
    }

    export function sequence<TContext>(
        transitions: (RunnableTransition<TContext>|RunnableTransition<TContext>[])[]): RunnableTransition<TContext>[] {
        return transitions.flat();
    }

    export async function run<TContext>(
        sequence: RunnableTransition<TContext>[],
        queue: IQueue<BaseAction>,
        context: TContext
    ) {
        for (const transition of sequence) {
            await transition(queue, context);
        }
    }
}
