import { BaseAction, IStateMachine } from "@mental-poker-toolkit/types";

// State machine implementation connecting two state machine
export class Connection<TAction1 extends BaseAction, TAction2 extends BaseAction, TContext>
    implements IStateMachine<TAction1 | TAction2, TContext>
{
    // State machines to connect
    constructor(
        private stateMachine1: IStateMachine<TAction1, TContext>,
        private stateMachine2: IStateMachine<TAction2, TContext>
    ) {}

    accept(action: TAction1 | TAction2, context: TContext): boolean {
        // If not done, run first state machine - else run second one
        return !this.stateMachine1.done()
            ? this.stateMachine1.accept(action as TAction1, context)
            : this.stateMachine2.accept(action as TAction2, context);
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
