import { BaseAction, IStateMachine, ITransport, Transition } from "@mental-poker-toolkit/types";
import { Sequence } from "./sequence";
import { Fork } from "./fork";
import { Connection } from "./connection";

namespace StateMachine {
    export function sequence<TAction extends BaseAction, TContext>(transitions: Transition<TAction, TContext>[]) {
        return new Sequence(transitions);
    }

    export function fork<TAction extends BaseAction, TContext>(forks: IStateMachine<TAction, TContext>[]) {
        return new Fork(forks);
    }

    export function connect<TAction extends BaseAction, TContext>(stateMachine1: IStateMachine<TAction, TContext>, stateMachine2: IStateMachine<TAction, TContext>) {
        return new Connection(stateMachine1, stateMachine2);
    }

    export function run<TAction extends BaseAction, TContext>(
        stateMachine: IStateMachine<TAction, TContext>,
        transport: ITransport<TAction>,
        context: TContext
    ): Promise<void> {
        // Create a promise that resolves when the state machine is done
        return new Promise<void>((resolve, reject) => {
            transport.on("actionPosted", (action) => {
                if (!stateMachine.accept(action, context)) {
                    reject(new Error(`Invalid action ${action}`));
                }

                if (stateMachine.done()) {
                    stateMachine.reset();
                    resolve();
                }
            });
        });
    }
}