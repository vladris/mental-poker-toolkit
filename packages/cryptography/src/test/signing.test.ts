import { describe, expect, test } from "@jest/globals";
import { Signing, SignatureProvider } from "../../lib";

if (!("crypto" in globalThis)) {
    globalThis.crypto = require("crypto");
}

describe("Signing tests", () => {
    test("Signing and verifying signature works", async () => {
        const kp = await Signing.generatePublicPrivateKeyPair();
        const signatureProvider = new SignatureProvider();

        const message = "Hello, world!";
        const signature = await signatureProvider.sign(message, kp.privateKey);

        expect(await signatureProvider.verifySignature(message, signature, kp.publicKey)).toBe(true);
    });

    test("Invalid signature causes verification to fail", async () => {
        const kp = await Signing.generatePublicPrivateKeyPair();
        const signatureProvider = new SignatureProvider();

        const message = "Hello, world!";
        let signature = await signatureProvider.sign(message, kp.privateKey);

        // Corrupt the signature
        signature = signature.slice(1) + signature[0];

        expect(await signatureProvider.verifySignature(message, signature, kp.publicKey)).toBe(false);
    });
});
