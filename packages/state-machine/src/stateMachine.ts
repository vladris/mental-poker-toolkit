import {
    BaseAction,
    IStateMachine,
    ITransport,
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

    export function run<TAction extends BaseAction, TContext>(
        stateMachine: IStateMachine<TAction, TContext>,
        transport: ITransport<TAction>,
        context: TContext
    ): Promise<void> {
        // Create a promise that resolves when the state machine is done
        return new Promise<void>((resolve, reject) => {
            const listener = (action: TAction) => {
                if (!stateMachine.accept(action, context)) {
                    reject(new Error(`Invalid action ${action}`));
                }

                if (stateMachine.done()) {
                    stateMachine.reset();

                    // Remove event listener
                    transport.off("actionPosted", listener);
                    resolve();
                }
            };
            transport.on("actionPosted", listener);
        });
    }
}
