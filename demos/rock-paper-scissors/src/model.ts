import { SRA } from "@mental-poker-toolkit/cryptography";
import { BaseAction, ClientId, ITransport, SRAKeyPair } from "@mental-poker-toolkit/types";
import { StateMachine } from "@mental-poker-toolkit/state-machine";

export type PlaySelection = "Rock" | "Paper" | "Scissors";

export type GameStatus = "Waiting" | "Ready" | "Win" | "Loss" | "Draw";

export type EncryptedSelection = string;

export type PlayAction = { clientId: ClientId, type: "PlayAction", encryptedSelection: EncryptedSelection };

export type RevealAction = { clientId: ClientId, type: "RevealAction", key: SRAKeyPair };

export type PlayValue = PlaySelection & { type: "Selection "} | EncryptedSelection & { type: "Encrypted"} | { type: "None" };


export type TestAction = BaseAction & { type: "TestAction", value: string };

export type Action = TestAction | PlayAction | RevealAction;

export type Context = { 
    clientId: string,
    transport: ITransport<Action>,
    myPlay: PlaySelection | EncryptedSelection,
    theirPlay: PlaySelection | EncryptedSelection,
    gameStatus: GameStatus
};

export function makePlay(clientId: ClientId, selection: PlaySelection): [PlayAction, RevealAction] {
    const kp = SRA.generateKeyPair(BigIntMath.randBigInt())
    
    return [
        { clientId, type: "PlayAction", encryptedSelection: SRA.encryptString(selection, kp) },
        { clientId, type: "RevealAction", key: kp }
    ];
}

export async function playRound(playAction: PlayAction, revealAction: RevealAction, context: Context) {
    const playTurn = (play: PlayAction, context: Context) => {
        if (play.clientId === context.clientId) {
            context.myPlay = play.encryptedSelection;
        } else {
            context.theirPlay = play.encryptedSelection;
        }

        return true;
    }

    context.transport.postAction(playAction);

    await StateMachine.run(StateMachine.sequence([playTurn, playTurn]), context.transport, context);

    const revealTurn = (reveal: RevealAction, context: Context) => {
        if (reveal.clientId === context.clientId) {
            context.myPlay = SRA.decryptString(context.myPlay, reveal.key);
        } else {
            context.theirPlay = SRA.decryptString(context.theirPlay, reveal.key);
        }

        return true;
    }

    context.transport.postAction(revealAction);

    await StateMachine.run(StateMachine.sequence([revealTurn, revealTurn]), context.transport, context);
};
