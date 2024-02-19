import {
    BaseAction,
    IStateMachine,
    ITransport,
} from "@mental-poker-toolkit/types";

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
