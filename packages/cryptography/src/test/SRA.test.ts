import { describe, expect, test } from "@jest/globals";
import { SRA } from "../SRA";
import { BigIntUtils } from "../bigIntUtils";

if (!("crypto" in globalThis)) {
    globalThis.crypto = require("crypto");
}

describe("SRA tests", () => {
    test("Roundtrip", async () => {
        const kp = await SRA.generateKeyPair(BigIntUtils.randPrime());
   
        const plaintext = "Hello, world!";
        const cypherText = await SRA.encryptString(plaintext, kp);
        
        expect(await SRA.decryptString(cypherText, kp)).toBe(plaintext);
    });

    test("Double encryption", async () => {
        const sharedPrime = BigIntUtils.randPrime();

        const kp1 = await SRA.generateKeyPair(sharedPrime);
        const kp2 = await SRA.generateKeyPair(sharedPrime);

        const plaintext = "Hello, world!";
        const cypherText = await SRA.encryptString(SRA.encryptString(plaintext, kp1), kp2);

        expect(await SRA.decryptString(await SRA.decryptString(cypherText, kp2), kp1)).toBe(plaintext);
    });

    test("Commutativity", async () => {
        const sharedPrime = BigIntUtils.randPrime();

        const kp1 = await SRA.generateKeyPair(sharedPrime);
        const kp2 = await SRA.generateKeyPair(sharedPrime);

        const plaintext = "Hello, world!";
        const cypherText = await SRA.encryptString(SRA.encryptString(plaintext, kp1), kp2);

        expect(await SRA.decryptString(await SRA.decryptString(cypherText, kp1), kp2)).toBe(plaintext);
    });
});
