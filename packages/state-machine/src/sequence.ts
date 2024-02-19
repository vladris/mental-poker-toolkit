import {
    BaseAction,
    IStateMachine,
    Transition,
} from "@mental-poker-toolkit/types";

// State machine implementation taking a sequence of transitions
export class Sequence<TAction extends BaseAction, TContext>
    implements IStateMachine<TAction, TContext>
{
    // Current location in the sequence
    private at: number = 0;

    // Sequence of transitions
    constructor(private transitions: Transition<TAction, TContext>[]) {}

    accept(action: TAction, context: TContext): boolean {
        // Run current transition in the sequence
        if (this.done() || !this.transitions[this.at](action, context)) {
            return false;
        }

        // Advance position
        this.at++;
        return true;
    }

    done(): boolean {
        // We're done if we stepped through the whole sequence
        return this.at >= this.transitions.length;
    }

    reset(): void {
        // Reset by moving to the start of the sequence
        this.at = 0;
    }
}
