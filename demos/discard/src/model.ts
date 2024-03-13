import { BaseAction } from "@mental-poker-toolkit/types";

export type Action = BaseAction;

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