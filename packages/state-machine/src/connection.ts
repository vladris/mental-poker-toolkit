import {
    BaseAction,
    IStateMachine,
    Transition,
} from "@mental-poker-toolkit/types";

// State machine implementation connecting two state machine
export class Connection<TAction extends BaseAction, TContext>
    implements IStateMachine<TAction, TContext>
{
    // State machines to connect
    constructor(
        private stateMachine1: IStateMachine<TAction, TContext>,
        private stateMachine2: IStateMachine<TAction, TContext>
    ) {}

    accept(action: TAction, context: TContext): boolean {
        // If not done, run first state machine - else run second one
        return !this.stateMachine1.done()
            ? this.stateMachine1.accept(action, context)
            : this.stateMachine2.accept(action, context);
    }

    done(): boolean {
        // Done when second state machine is done
        return this.stateMachine2.done();
    }

    reset(): void {
        // Reset both state machines
        this.stateMachine1.reset();
        this.stateMachine2.reset();
    }
}
