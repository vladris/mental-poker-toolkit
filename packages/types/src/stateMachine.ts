import { BaseAction } from "./base";

// Check if valid transition
export type Transition<TAction extends BaseAction, TContext> = (
    action: TAction,
    context: TContext
) => boolean;

// State machine interface
export interface IStateMachine<TAction extends BaseAction, TContext> {
    // Accept an action
    accept(action: TAction, context: TContext): boolean;

    // Check if done
    done(): boolean;

    // Reset state machine
    reset(): void;
}
