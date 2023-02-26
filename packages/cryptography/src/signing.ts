// Digital signing using crypto.subtle
import { ClientId } from "@mental-poker-toolkit/types";
import { encode, decode } from "base64-arraybuffer";
import { Key, PublicPrivateKeyPair } from "@mental-poker-toolkit/types";

export namespace Signing {
    // Generate public/private key pair
    export async function generatePublicPrivateKeyPair(): Promise<PublicPrivateKeyPair> {
        const subtle = crypto.subtle;
        const keys = await subtle.generateKey(
            {
                name: "rsa-oaep",
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "sha-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        return {
            publicKey: encode(await subtle.exportKey("spki", keys.publicKey)),
            privateKey: encode(
                await subtle.exportKey("pkcs8", keys.privateKey)
            ),
        };
    }

    // Returns payload signature
    export async function sign(
        payload: string,
        privateKey: Key
    ): Promise<string> {
        const subtle = crypto.subtle;

        const pk = await subtle.importKey(
            "pkcs8",
            decode(privateKey),
            { name: "RSA-PSS", hash: "SHA-256" },
            true,
            ["sign"]
        );

        return encode(
            await subtle.sign(
                { name: "RSA-PSS", saltLength: 256 },
                pk,
                decode(payload)
            )
        );
    }

    // Verify payload signature
    export async function verifySignature(
        payload: string,
        signature: string,
        publicKey: Key
    ): Promise<boolean> {
        const subtle = crypto.subtle;

        const pk = await subtle.importKey(
            "spki",
            decode(publicKey),
            { name: "RSA-PSS", hash: "SHA-256" },
            true,
            ["verify"]
        );

        return subtle.verify(
            { name: "RSA-PSS", saltLength: 256 },
            pk,
            decode(signature),
            decode(payload)
        );
    }
}
