import { SRAKeyPair } from "@mental-poker-toolkit/types";
import { SRA, SerializedSRAKeyPair, SRAKeySerializationHelper } from "@mental-poker-toolkit/cryptography";
import { RootStore, updateDeckViewModel } from "./store";

// Get a new deck of cards
export function getDeck() {
    const deck: string[] = [];

    for (const value of ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]) {
        for (const suit of ["hearths", "diamonds", "clubs", "spades"]) {
            deck.push(value + ":" + suit);
        }
    }

    return deck;
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
        return this.drawPile[this.drawPile.length - 1];
    }

    // Put a card in my hand
    async myDraw(serializedSRAKeyPair: SerializedSRAKeyPair) {
        const index = this.drawPile.pop()!;
        this.myCards.push(index);
        this.othersKeys[index] = SRAKeySerializationHelper.deserializeSRAKeyPair(serializedSRAKeyPair);

        await this.updateViewModel();
    }

    // Other player puts a card in their hand
    async othersDraw() {
        this.othersCards.push(this.drawPile.pop()!);
        
        await this.updateViewModel();
    }

    // Discard a card
    async myDiscard(index: number) {
        this.discardPile.push(this.myCards.splice(this.myCards.indexOf(index), 1)[0]);

        this.updateViewModel();
    }

    // The other player discards a card
    async othersDiscard(index: number, serializedSRAKeyPair: SerializedSRAKeyPair) {
        this.othersKeys[index] = SRAKeySerializationHelper.deserializeSRAKeyPair(serializedSRAKeyPair);
        this.discardPile.push(this.othersCards.splice(this.othersCards.indexOf(index), 1)[0]);

        this.updateViewModel();
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
