import { SignedTransport } from "@mental-poker-toolkit/signed-transport";
import { keyExchange } from "./keyExchange";
import {
    BaseAction,
    ClientId,
    IQueue,
    ITransport,
} from "@mental-poker-toolkit/types";
import { ActionQueue } from "@mental-poker-toolkit/action-queue";

// Upgrade an unsigned transport to a queue over signed transport.
export async function upgradeTransport<T extends BaseAction>(
    players: number,
    clientId: ClientId,
    transport: ITransport<T>
): Promise<IQueue<T>> {
    // Perform key exchange
    const [keyPair, keyStore] = await keyExchange(
        players,
        clientId,
        new ActionQueue(
            transport as unknown as ITransport<BaseAction>,
            true
        )
    );

    // Create a queue over a signed transport
    return new ActionQueue(
        new SignedTransport(
            transport,
            { clientId, privateKey: keyPair.privateKey },
            keyStore
        )
    );
}
