import { SRA } from '@mental-poker-toolkit/cryptography';
import { SRAKeyPair } from '@mental-poker-toolkit/types';

export type KeyProvider = () => Promise<SRAKeyPair>;

// Create a function that returns SRA key pairs async
export function makeKeyQueue(sharedPrime: bigint, n: number): KeyProvider {
    const queue: Promise<SRAKeyPair>[] = [];

    for (let i = 0; i < n; i++) {
        queue.push(new Promise((resolve) => {
            resolve(SRA.generateKeyPair(sharedPrime));
        }));
    }

    return async () => {
        if (queue.length === 0) {
            throw new Error("Queue is empty");
        }

        return queue.shift()!;
    }
}
