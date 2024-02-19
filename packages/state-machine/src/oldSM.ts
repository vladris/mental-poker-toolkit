import { BaseAction, ClientId } from "@mental-poker-toolkit/types";

// Response for an action is a callback
type Response = (action: BaseAction) => void;

// Who took the action
type ActionOriginator = "me" | "other" | "any";

// Expected action type and optional response
type ExpectedAction = {
    by: ActionOriginator;
    type: string;
    response?: Response;
};

/*
export class StateMachine<TAction extends BaseAction> {
    // Queue of expected actions
    private expectedActions: [ExpectedAction][] = [];

    // Constructor sets the ID of this client
    constructor(private clientId: ClientId) {}

    // Process an incoming action
    acceptAction(action: TAction) {
        const expected = this.expectedActions.shift();

        // We should always be expecting something
        if (!expected) {
            throw Error("We are not expecting anything?");
        }

        for (const expectedAction of expected) {
            if (this.checkExpected(expectedAction, action)) {
                // This is the expected action
                if (expectedAction.response) {
                    expectedAction.response(action);
                }
                return;
            }
        }

        throw Error("Unexpected action");
    }

    // Create a "from me" expected action
    fromMe(type: string, response?: Response) {
        return { by: "me", type, response };
    }

    // Create a "from other" expected action
    fromOther(type: string, response?: Response) {
        return { by: "other", type, response };
    }

    // Create a "from any" expected action
    fromAny(type: string, response?: Response) {
        return { by: "any", type, response };
    }

    // Queue expected action
    expectAction(expected: ExpectedAction) {
        this.expectedActions.push([expected]);
    }

    // Queue multiple expected actions
    expectActions(expected: [ExpectedAction]) {
        this.expectedActions.push(expected);
    }

    // Check if expected and actual actions match
    private checkExpected(expected: ExpectedAction, action: TAction) {
        // Check if the action is of the expected type
        if (expected.type !== action.type) {
            return false;
        }

        // Check if the action is from the expected originator
        if (expected.by === "me" && action.clientId !== this.clientId) {
            return false;
        } else if (
            expected.by === "other" &&
            action.clientId === this.clientId
        ) {
            return false;
        }

        // This is the expected action
        return true;
    }
}
*/
