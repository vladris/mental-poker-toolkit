import { SignedTransport } from "@mental-poker-toolkit/signed-transport";
import { KeyExchangeAction, keyExchange, makeCryptoContext } from "./keyExchange";
import { BaseAction, ClientId, ITransport } from "@mental-poker-toolkit/types";

// Upgrade an unsigned transport to a signed transport
export async function upgradeTransport<T extends BaseAction>(clientId: ClientId, transport: ITransport<T>): Promise<ITransport<T>> {
    // Create CryptoContext
    const context = await makeCryptoContext(clientId);

    // Perform key exchange
    await keyExchange(context, transport as unknown as ITransport<KeyExchangeAction>)

    // Create a signed transport
    return new SignedTransport(transport, { clientId: context.clientId, privateKey: context.me.privateKey }, context.keyStore);
}
