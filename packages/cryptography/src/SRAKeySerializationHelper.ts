import { BigIntUtils } from "./bigIntUtils";
import { SRAKeyPair } from "@mental-poker-toolkit/types";

// Workaround for BigInt serialization not being supported
export namespace SRAKeySerializationHelper {
    export type SerializedSRAKeyPair = {
        prime: string;
        enc: string;
        dec: string;
    };

    export function serializeSRAKeyPair(kp: SRAKeyPair): SerializedSRAKeyPair {
        return {
            prime: BigIntUtils.bigIntToString(kp.prime),
            enc: BigIntUtils.bigIntToString(kp.enc),
            dec: BigIntUtils.bigIntToString(kp.dec),
        };
    }

    export function deserializeSRAKeyPair(kp: SerializedSRAKeyPair): SRAKeyPair {
        return {
            prime: BigIntUtils.stringToBigInt(kp.prime),
            enc: BigIntUtils.stringToBigInt(kp.enc),
            dec: BigIntUtils.stringToBigInt(kp.dec),
        };
    }
}
