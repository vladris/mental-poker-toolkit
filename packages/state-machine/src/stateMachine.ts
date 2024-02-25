import {
    BaseAction,
    IStateMachine,
    IQueue,
    Transition,
} from "@mental-poker-toolkit/types";
import { Sequence } from "./sequence";
import { Fork } from "./fork";
import { Connection } from "./connection";

export namespace StateMachine {
    export function sequence<TAction extends BaseAction, TContext>(
        transitions: Transition<TAction, TContext>[]
    ) {
        return new Sequence(transitions);
    }

    export function sequenceN<TAction extends BaseAction, TContext>(
        transition: Transition<TAction, TContext>,
        times: number
    ) {
        return new Sequence(new Array(times).fill(transition));
    }

    export function fork<TAction extends BaseAction, TContext>(
        forks: IStateMachine<TAction, TContext>[]
    ) {
        return new Fork(forks);
    }

    export function connect<
        TAction1 extends BaseAction,
        TAction2 extends BaseAction,
        TContext
    >(
        stateMachine1: IStateMachine<TAction1, TContext>,
        stateMachine2: IStateMachine<TAction2, TContext>
    ) {
        return new Connection(stateMachine1, stateMachine2);
    }

    export async function run<TAction extends BaseAction, TContext>(
        stateMachine: IStateMachine<TAction, TContext>,
        queue: IQueue<TAction>,
        context: TContext
    ) {
        // Run state machine until done
        while (!stateMachine.done()) {
            // Dequeue action
            const action = await queue.dequeue();

            // If action is not accepted, throw error
            if (!stateMachine.accept(action, context)) {
                throw new Error(`Invalid action ${action}`);
            }
        }

        // Reset state machine
        stateMachine.reset();
    }
}
