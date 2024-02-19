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
    let resolve = undefined;

    const result = new Promise((resolve, reject) => {
        deffered = { resolve, reject };
    });

    transport.on("actionPosted", (action) => {
        stateMachine.accept(action, context);

        if (stateMachine.done()) {
            stateMachine.reset();
        }
    });

    return result;
}
