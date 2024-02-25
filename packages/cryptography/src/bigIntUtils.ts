import { BigIntMath } from "./bigIntMath";

export namespace BigIntUtils {
    // Generates a large prime number
    export function randPrime(sizeInBytes: number = 128): bigint {
        return BigIntMath.randPrime(sizeInBytes);
    }

    // Converts a string into bigint - shouldn't be exported but we need this
    // since BigInt is not serializable
    export function stringToBigInt(str: string): bigint {
        let result = BigInt(0);

        for (const c of str) {
            // Making an assumption here that we're dealing with char codes under 256
            // to keep things simple. Might need to revisit if we want to generalize.
            if (c.charCodeAt(0) > 255) {
                throw Error(`Unexpected char code ${c.charCodeAt(0)} for ${c}`);
            }

            // Build a bigint out of all the char codes in the string
            result = result * BigInt(256) + BigInt(c.charCodeAt(0));
        }

        return result;
    }

    // Converts a bigint into a string - shouldn't be exported but we need this
    // since BigInt is not serializable
    export function bigIntToString(n: bigint): string {
        let result = "";
        let m = BigInt(0);

        // Inverse of stringToBigInt - decompose n to char codes
        while (n > 0) {
            [n, m] = [n / BigInt(256), n % BigInt(256)];
            result = String.fromCharCode(Number(m)) + result;
        }

        return result;
    }
}
