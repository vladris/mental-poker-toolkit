import { SignedTransport } from "@mental-poker-toolkit/signed-transport";
import {
    KeyExchangeAction,
    keyExchange,
    makeCryptoContext,
} from "./keyExchange";
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
    // Create CryptoContext
    const context = await makeCryptoContext(clientId);

    // Perform key exchange
    await keyExchange(
        players,
        context,
        new ActionQueue(
            transport as unknown as ITransport<KeyExchangeAction>,
            true
        )
    );

    // Create a queue over a signed transport
    return new ActionQueue(
        new SignedTransport(
            transport,
            { clientId: context.clientId, privateKey: context.me.privateKey },
            context.keyStore
        )
    );
}
