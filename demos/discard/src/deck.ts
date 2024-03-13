import { SRAKeyPair } from "@mental-poker-toolkit/types";
import { SRA } from "@mental-poker-toolkit/cryptography";

// Get a new deck of cards
export function getDeck() {
    const deck: string[] = [];

    for (const value of ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]) {
        for (const suit of ["hearths", "diamonds", "clubs", "spades"]) {
            deck.push(value + suit);
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
        private myKeys: SRAKeyPair[]
        ) {
        this.drawPile = encryptedCards.map((_, i) => i);
    }

    // Get key at index
    getKey(index: number) {
        return this.myKeys[index];
    }

    // Get decrypted card at index
    cardAt(index: number) {
        if (!this.decryptedCards[index]) {
            // Decrypt with my key
            const partial = SRA.decryptString(this.encryptedCards[index], this.myKeys[index]);

            // Decrypt with other player key and store
            this.decryptedCards[index] = SRA.decryptString(partial, this.othersKeys[index]);
        }

        return this.decryptedCards[index];
    }

    // Draw a card
    draw() {
        if (this.drawPile.length === 0) {
            throw new Error("No cards to draw");
        }

        return this.drawPile.pop() as number;
    }

    // Put a card in my hand
    putInMyHand(index: number, SRAKeyPair: SRAKeyPair) {
        this.myCards.push(index);
        this.othersKeys[index] = SRAKeyPair;
        return index;
    }

    // Other player puts a card in their hand
    putInOthersHand(index: number) {
        return this.othersCards.push(index);
    }

    // Discard a card
    myDiscard(index: number) {
        this.discardPile.push(this.myCards.splice(this.myCards.indexOf(index), 1)[0]);
    }

    // The other player discards a card
    othersDiscard(index: number, SRAKeyPair: SRAKeyPair) {
        this.othersKeys[index] = SRAKeyPair;
        this.discardPile.push(this.othersCards.splice(this.othersCards.indexOf(index), 1)[0]);
    }
}
