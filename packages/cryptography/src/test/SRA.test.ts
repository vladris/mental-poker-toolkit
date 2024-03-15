import { describe, expect, test } from "@jest/globals";
import { SRA } from "../SRA";
import { BigIntUtils } from "../bigIntUtils";

if (!("crypto" in globalThis)) {
    globalThis.crypto = require("crypto");
}

describe("SRA tests", () => {
    // Do key generation once since it's expensive
    const sharedPrime = BigIntUtils.randPrime();
    const kp1 = SRA.generateKeyPair(sharedPrime);
    const kp2 = SRA.generateKeyPair(sharedPrime);

    test("Roundtrip works", async () => {
        const plaintext = "Hello, world!";
        const cypherText = await SRA.encryptString(plaintext, kp1);
        
        expect(await SRA.decryptString(cypherText, kp1)).toBe(plaintext);
    });

    test("Double encryption works", async () => {
        const plaintext = "Hello, world!";
        const cypherText = await SRA.encryptString(SRA.encryptString(plaintext, kp1), kp2);

        expect(await SRA.decryptString(await SRA.decryptString(cypherText, kp2), kp1)).toBe(plaintext);
    });

    test("Commutativity (decrypting in different order) works", async () => {
        const plaintext = "Hello, world!";
        const cypherText = await SRA.encryptString(SRA.encryptString(plaintext, kp1), kp2);

        expect(await SRA.decryptString(await SRA.decryptString(cypherText, kp1), kp2)).toBe(plaintext);
    });
});
