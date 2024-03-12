import { BaseAction, IQueue, SRAKeyPair } from "@mental-poker-toolkit/types";
import { KeyProvider, makeKeyQueue } from "./keyQueue";
import { SRA } from "@mental-poker-toolkit/cryptography";
import { StateMachine } from "@mental-poker-toolkit/state-machine";

// Mental Poker shuffle is 2-step
type ShuffleAction1 = BaseAction & { type: "Shuffle1"; deck: string[] };
type ShuffleAction2 = BaseAction & { type: "Shuffle2"; deck: string[] };

// Shuffle context
type ShuffleContext = {
    clientId: string;
    deck: string[];
    commonKey?: SRAKeyPair;
    privateKeys?: SRAKeyPair[];
};

// Randomly shuffle an array
function shuffleArray<T>(arr: T[]): T[] {
    let currentIndex = arr.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
  
    return arr;
};

// First shuffle step
async function shuffle1(getKeyPair: KeyProvider, deck: string[]): Promise<[SRAKeyPair, string[]]> {
    const commonKey = await getKeyPair();

    // Encrypt each card with the common key and shuffle the deck
    deck = shuffleArray(deck.map((card) => SRA.encrypt(card, commonKey)));

    return [commonKey, deck];
};

// Second shuffle step
async function shuffle2(commonKey: SRAKeyPair, getKeyPair: KeyProvider, deck: string[]): Promise<[SRAKeyPair[], string[]]> {
    const privateKeys: SRAKeyPair[] = [];

    // Decrypt each card with the common key
    deck = deck.map((card) => SRA.decrypt(card, commonKey));

    // For each card, generate a new key pair and re-encrypt
    for (let i = 0; i < deck.length; i++) {
        privateKeys.push(await getKeyPair());
        deck[i] = SRA.encrypt(deck[i], privateKeys[i]);
    }

    return [privateKeys, deck];
}

// Shuffle deck
export async function shuffle<T extends BaseAction, K>(
    clientId: string,
    turnOrder: string[],
    sharedPrime: bigint,
    deck: string[],
    actionQueue: IQueue<T>
): Promise<[SRAKeyPair[], string[]]> {
    const getKeyPair = makeKeyQueue(sharedPrime, deck.length + 1);

    const context: ShuffleContext = { clientId, deck };

    if (turnOrder.length !== 2) {
        throw new Error("Shuffle only implemented for exactly two players");
    }

    const imFirst = clientId === turnOrder[0];
    const shuffleQueue = actionQueue as unknown as IQueue<ShuffleAction1 | ShuffleAction2>;

    const enqueueShuffle1 = async (context: ShuffleContext) => {
        [context.commonKey, context.deck] = await shuffle1(getKeyPair, context.deck);

        await shuffleQueue.enqueue({
            type: "Shuffle1",
            clientId,
            deck: context.deck,
        });
    }

    const shuffleStep1 = (action: ShuffleAction1, context: ShuffleContext) => {
        // This should be a Shuffle1 action
        if (action.type !== "Shuffle1") {
            return false;
        }

        // Update deck
        context.deck = action.deck;

        // Second player should enqueue a shuffle1 action
        if (!imFirst) {
            enqueueShuffle1(context);
        }

        return true;
    };

    const enqueueShuffle2 = async (context: ShuffleContext) => {
        [context.privateKeys, context.deck] = await shuffle2(context.commonKey!, getKeyPair, context.deck);

        await shuffleQueue.enqueue({
            type: "Shuffle2",
            clientId,
            deck: context.deck,
        });
    }

    const shuffleStep2 = (action: ShuffleAction2, context: ShuffleContext) => {
        // This should be a Shuffle2 action
        if (action.type !== "Shuffle2") {
            return false;
        }

        // Update deck
        context.deck = action.deck;

        // Second player should enqueue a shuffle2 action
        if (imFirst) {
            enqueueShuffle2(context);
        }
    
        return true;
    };

    // First player kicks off shuffle step 1
    if (imFirst) {
        enqueueShuffle1(context);
    }

    // Create state machine
    await StateMachine.run(StateMachine.sequenceN(shuffleStep1, 2), shuffleQueue, context);

    // First player kicks off shuffle step 2
    if (imFirst) {
        enqueueShuffle2(context);
    }
    
    await StateMachine.run(StateMachine.sequenceN(shuffleStep2, 2), shuffleQueue, context);

    return [context.privateKeys!, context.deck];
}
