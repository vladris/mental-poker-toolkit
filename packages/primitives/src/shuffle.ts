import { BaseAction, IQueue, SRAKeyPair } from "@mental-poker-toolkit/types";
import { KeyProvider } from "./keyProvider";
import { SRA } from "@mental-poker-toolkit/cryptography";
import { StateMachine as sm } from "@mental-poker-toolkit/state-machine";

// Mental Poker shuffle is 2-step
type ShuffleAction1 = BaseAction & { type: "Shuffle1"; deck: string[] };
type ShuffleAction2 = BaseAction & { type: "Shuffle2"; deck: string[] };

// Shuffle context
type ShuffleContext = {
    clientId: string;
    deck: string[];
    imFirst: boolean;
    keyProvider: KeyProvider;
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
async function shuffle1(keyProvider: KeyProvider, deck: string[]): Promise<[SRAKeyPair, string[]]> {
    const commonKey = keyProvider.make();

    // Encrypt each card with the common key and shuffle the deck
    deck = shuffleArray(deck.map((card) => SRA.encryptString(card, commonKey)));

    return [commonKey, deck];
};

// Second shuffle step
async function shuffle2(commonKey: SRAKeyPair, keyProvider: KeyProvider, deck: string[]): Promise<[SRAKeyPair[], string[]]> {
    const privateKeys: SRAKeyPair[] = [];

    // Decrypt each card with the common key
    deck = deck.map((card) => SRA.decryptString(card, commonKey));

    // For each card, generate a new key pair and re-encrypt
    for (let i = 0; i < deck.length; i++) {
        privateKeys.push(keyProvider.make());
        deck[i] = SRA.encryptString(deck[i], privateKeys[i]);
    }

    return [privateKeys, deck];
}

// 2-step Mental Poker shuffle sequence 
function makeShuffleSequence() {
    return sm.sequence([
        sm.local(async (queue: IQueue<ShuffleAction1>, context: ShuffleContext) => {
            // Don't do anything if we're not the first player
            if (!context.imFirst) {
                return;
            }

            // Otherwise shuffle the deck
            [context.commonKey, context.deck] = await shuffle1(context.keyProvider, context.deck);

            // Post deck
            await queue.enqueue({
                type: "Shuffle1",
                clientId: context.clientId,
                deck: context.deck,
            });
        }),
        sm.transition(async (action: ShuffleAction1, context: ShuffleContext) => {
            // This should be a Shuffle1 action
            if (action.type !== "Shuffle1") {
                throw new Error("Invalid action type");
            }

            // Update deck
            context.deck = action.deck;
        }),
        sm.local(async (queue: IQueue<ShuffleAction1>, context: ShuffleContext) => {
            // Now don't do anything if we are first player (let other player shuffle)
            if (context.imFirst) {
                return;
            }

            [context.commonKey, context.deck] = await shuffle1(context.keyProvider, context.deck);

            // Post deck
            await queue.enqueue({
                type: "Shuffle1",
                clientId: context.clientId,
                deck: context.deck,
            });
        }),
        sm.transition(async (action: ShuffleAction1, context: ShuffleContext) => {
            // This should be a Shuffle1 action
            if (action.type !== "Shuffle1") {
                throw new Error("Invalid action type");
            }

            // Update deck
            context.deck = action.deck;
        }),
        sm.local(async (queue: IQueue<ShuffleAction2>, context: ShuffleContext) => {
            // Again, only first player should start the second shuffle step
            if (!context.imFirst) {
                return;
            }

            [context.privateKeys, context.deck] = await shuffle2(context.commonKey!, context.keyProvider, context.deck);

            // Post deck
            await queue.enqueue({
                type: "Shuffle2",
                clientId: context.clientId,
                deck: context.deck,
            });
        }),
        sm.transition(async (action: ShuffleAction2, context: ShuffleContext) => {
            // This should be a Shuffle2 action
            if (action.type !== "Shuffle2") {
                throw new Error("Invalid action type");
            }

            // Update deck
            context.deck = action.deck;
        }),
        sm.local(async (queue: IQueue<ShuffleAction2>, context: ShuffleContext) => {
            // Now second player does the second shuffle step
            if (context.imFirst) {
                return;
            }

            [context.privateKeys, context.deck] = await shuffle2(context.commonKey!, context.keyProvider, context.deck);

            // Post deck
            await queue.enqueue({
                type: "Shuffle2",
                clientId: context.clientId,
                deck: context.deck,
            });
        }),
        sm.transition(async (action: ShuffleAction2, context: ShuffleContext) => {
            // This should be a Shuffle2 action
            if (action.type !== "Shuffle2") {
                throw new Error("Invalid action type");
            }

            // Update deck
            context.deck = action.deck;
        })
    ]);
}

// Shuffle deck
export async function shuffle(
    clientId: string,
    turnOrder: string[],
    sharedPrime: bigint,
    deck: string[],
    actionQueue: IQueue<BaseAction>,
    keySize: number = 128 // Key size, defaults to 128 bytes
): Promise<[SRAKeyPair[], string[]]> {
    if (turnOrder.length !== 2) {
        throw new Error("Shuffle only implemented for exactly two players");
    }

    const context: ShuffleContext = { 
        clientId, 
        deck, 
        imFirst: clientId === turnOrder[0],
        keyProvider: new KeyProvider(sharedPrime, keySize)
    };
    
    const shuffleSequence = makeShuffleSequence();

    await sm.run(shuffleSequence, actionQueue, context);

    return [context.privateKeys!, context.deck];
}
