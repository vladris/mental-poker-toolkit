import { SRAKeyPair } from "@mental-poker-toolkit/types";
import { SRA, SerializedSRAKeyPair, SRAKeySerializationHelper } from "@mental-poker-toolkit/cryptography";
import { RootStore, updateDeckViewModel } from "./store";

// Get a new deck of cards
export function getDeck() {
    const deck: string[] = [];

    for (const value of ["9", "10", "J", "Q", "K", "A"]) {
        for (const suit of ["hearts", "diamonds", "clubs", "spades"]) {
            deck.push(value + ":" + suit);
        }
    }

    
    const deck2 = ["2", "3", "4", "5", "6", "7", "9", "10", "J", "Q", "K", "A"].map((v) => v + ":hearts");
    deck2.push("A:spades")
    return deck2;

    return deck;
}

// Check if two cards match either suit or value
export function matchSuitOrValue(a: string, b: string) {
    const [aValue, aSuit] = a.split(":");
    const [bValue, bSuit] = b.split(":");

    return aValue === bValue || aSuit === bSuit;
}

// Manages an encrypted deck of cards
export class Deck {
    private myCards: number[] = [];
    private othersCards: number[] = [];
    private drawPile: number[] = [];
    private discardPile: number[] = [];

    private decryptedCards: (string | undefined)[] = [];
    private othersKeys: SRAKeyPair[] = [];

    constructor(
        private encryptedCards: string[],
        private myKeys: SRAKeyPair[],
        private store: RootStore
        ) {
        this.drawPile = encryptedCards.map((_, i) => i);
    }

    // Get key at index
    getKey(index: number) {
        return SRAKeySerializationHelper.serializeSRAKeyPair(this.myKeys[index]);
    }

    // Get key from hand
    getKeyFromHand(index: number) {
        return SRAKeySerializationHelper.serializeSRAKeyPair(this.myKeys[this.myCards[index]]);
    }

    // Get decrypted card at index
    cardAt(index: number) {
        if (!this.decryptedCards[index]) {
            // Decrypt with my key
            const partial = SRA.decryptString(this.encryptedCards[index], this.myKeys[index]);

            // Decrypt with other player key and store
            this.decryptedCards[index] = SRA.decryptString(partial, this.othersKeys[index]);
        }

        return this.decryptedCards[index]!;
    }

    // Top of draw pile
    getDrawIndex() {
        return this.drawPile[0];
    }

    // Put a card in my hand
    async myDraw(serializedSRAKeyPair: SerializedSRAKeyPair) {
        const index = this.drawPile.shift()!;
        this.myCards.push(index);
        this.othersKeys[index] = SRAKeySerializationHelper.deserializeSRAKeyPair(serializedSRAKeyPair);

        await this.updateViewModel();
    }

    // Other player puts a card in their hand
    async othersDraw() {
        this.othersCards.push(this.drawPile.shift()!);
        
        await this.updateViewModel();
    }

    // Discard a card
    async myDiscard(index: number) {
        const cardIndex = this.myCards.splice(index, 1)[0];
        this.discardPile.push(cardIndex);

        this.updateViewModel();
    }

    // The other player discards a card
    async othersDiscard(index: number, serializedSRAKeyPair: SerializedSRAKeyPair) {
        const cardIndex = this.othersCards.splice(index, 1)[0];
        this.othersKeys[cardIndex] = SRAKeySerializationHelper.deserializeSRAKeyPair(serializedSRAKeyPair);
        this.discardPile.push(cardIndex);

        this.updateViewModel();
    }

    // Check if I can draw and/or discard
    canIMove() {
        // If there's nothing on the discard pile I can play anything
        if (this.discardPile.length === 0) {
            return true;
        }

        // We must have at least a card on the draw pile or a card we can discard
        return this.drawPile.length > 0 || this.myCards.some((index) =>
            matchSuitOrValue(this.cardAt(index), this.cardAt(this.discardPile[this.discardPile.length - 1])));
    }

    private async updateViewModel() {
        await this.store.dispatch(updateDeckViewModel({ 
            drawPile: this.drawPile.length,
            discardPile: this.discardPile.map((i) => this.cardAt(i)),
            myCards: this.myCards.map((i) => this.cardAt(i)),
            othersHand: this.othersCards.length,
        }));
    }
}

export type DeckViewModel = {
    drawPile: number;
    discardPile: string[];
    myCards: string[];
    othersHand: number;
};

export const defaultDeckViewModel: DeckViewModel = {
    drawPile: 0,
    discardPile: [],
    myCards: [],
    othersHand: 0,
};
