import { BaseAction } from "./base";
import { IQueue } from "./queue";

// State machine transition takes an action and a context and return true if the transition is valid
export type Transition<TAction extends BaseAction, TContext> = (
    action: TAction,
    context: TContext
) => void | Promise<void>;

// LocalAction is a special action that is not sent over the transport 
export type LocalAction = { clientId: string, type: "LocalAction" }

// Local transition is a function that will be called right away (rather than waiting for transport)
export type LocalTransition<TAction extends BaseAction, TContext> = (actionQueue: IQueue<TAction>, context: TContext) => void | Promise<void>; 

// A runnable transition can be directly invoked
export type RunnableTransition<TContext> = (actionQueue: IQueue<BaseAction>, context: TContext) => Promise<void>;
