import {
    BaseAction,
    IStateMachine,
    Transition,
} from "@mental-poker-toolkit/types";

// State machine implementation forking to multiple state machines
export class Fork<TAction extends BaseAction, TContext>
    implements IStateMachine<TAction, TContext>
{
    // Current selected state machine
    private selection: IStateMachine<TAction, TContext> | undefined = undefined;

    // Possible state machines to execute
    constructor(private forks: IStateMachine<TAction, TContext>[]) {}

    accept(action: TAction, context: TContext): boolean {
        // If we have a selection, delegate to it
        if (this.selection !== undefined) {
            return this.selection.accept(action, context);
        }

        // First state machine to accept the action becomes the selected state machine
        for (const fork of this.forks) {
            if (fork.accept(action, context)) {
                this.selection = fork;
                return true;
            }
        }

        return false;
    }

    done(): boolean {
        // Done when selected state machine is done
        return this.selection !== undefined && this.selection.done();
    }

    reset(): void {
        // Reset selected state machine and undo selection
        if (this.selection !== undefined) {
            this.selection.reset();
        }

        this.selection = undefined;
    }
}
