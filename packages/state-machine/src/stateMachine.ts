import {
    BaseAction,
    IQueue,
    Transition,
    LocalTransition,
    RunnableTransition
} from "@mental-poker-toolkit/types";

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
