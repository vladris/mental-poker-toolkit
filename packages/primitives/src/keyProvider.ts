import { SRA } from '@mental-poker-toolkit/cryptography';

export class KeyProvider {
    constructor(
        private sharedPrime: bigint,
        private size: number = 128) {}

    make() {
        return SRA.generateKeyPair(this.sharedPrime, this.size);
    }
}
