// We need bigints to implement SRA algorithm, turns out most of the "batteries
// included" math in JS only works on number so here we go...
namespace BigIntMath {
    // Raises b to power e modulo m
    export function exp(b: bigint, e: bigint, m: bigint): bigint {
        // Implemented as ancient Egyptian multiplication algorithm which is log(e)
        if (e === BigInt(1)) {
            return b;
        }

        // At each step, square b and half e. Also apply modulo to keep numbers
        // smaller
        let result = BigIntMath.exp((b * b) % m, e / BigInt(2), m);

        // Multiply by b again if e is odd
        if (e % BigInt(2) === BigInt(1)) {
            result *= b;
        }

        return result % m;
    }

    // Greatest common divisor
    export function gcd(a: bigint, b: bigint): bigint {
        while (b) {
            [a, b] = [b, a % b];
        }

        return a;
    }

    // Modulo inverse (find x such that (a * x) % m == 1)
    export function modInverse(a: bigint, m: bigint) {
        a = ((a % m) + m) % m;

        if (!a || m < 2) {
            throw new Error("Invalid input");
        }

        // Find GCD (and remember numbers at each step)
        const s = [];
        let b = m;
        while (b) {
            [a, b] = [b, a % b];
            s.push({ a, b });
        }

        if (a !== BigInt(1)) {
            throw new Error("No invese");
        }

        // Find the inverse
        let x = BigInt(1);
        let y = BigInt(0);

        for (let i = s.length - 2; i >= 0; --i) {
            [x, y] = [y, x - y * (s[i].a / s[i].b)];
        }

        return ((y % m) + m) % m;
    }

    // Generates a random bigint of the given size (in bytes). Default is 128
    // bytes (1024 bits).
    export function randBigInt(sizeInBytes: number = 128): bigint {
        let buffer = new Uint8Array(sizeInBytes);
        crypto.getRandomValues(buffer);

        // Build a bigint out of the buffer
        let result = BigInt(0);
        buffer.forEach((n) => {
            result = result * BigInt(256) + BigInt(n);
        });

        return result;
    }

    // Generates a large prime number. The larger the size, the larger the
    // number - better crypto, worse perf. Default is 128 bytes (1024 bits).
    export function randPrime(sizeInBytes: number = 128): bigint {
        let candidate = BigInt(0);

        do {
            // We actually generate a bunch of random numbers and check each to
            // see if it is prime. Odds of hitting a prime < x are 1/ln(x)
            candidate = BigIntMath.randBigInt();
            // Miller-Rabin is a fast probabilistic primality test
        } while (!millerRabinTest(candidate));

        return candidate;
    }

    // Check if a is not a witness of n (where n = 2 ^ s * d + 1). Used by
    // Miller-Rabit test below.
    function isNotWitness(a: bigint, d: bigint, s: bigint, n: bigint): boolean {
        if (a === BigInt(0)) {
            return true;
        }

        // u is a ^ d % n
        let u = BigIntMath.exp(a, d, n);

        // a is not a witness if u - 1 = 0 or u + 1 = n
        if (u - BigInt(1) === BigInt(0) || u + BigInt(1) === n) {
            return true;
        }

        // Repeat s - 1 times
        for (let i = BigInt(0); i < s - BigInt(1); i++) {
            // u = u ^ 2 % n
            u = BigIntMath.exp(u, BigInt(2), n);

            // a is not a witness if u = n - 1
            if (u + BigInt(1) === n) {
                return true;
            }
        }

        // a is a witness of n
        return false;
    }

    // Miller-Rabin primality test
    function millerRabinTest(candidate: bigint): boolean {
        // Handle some obvious cases
        if (candidate === BigInt(2) || candidate === BigInt(3)) {
            return true;
        }
        if (candidate % BigInt(2) === BigInt(0) || candidate < BigInt(2)) {
            return false;
        }

        // Find s and t such that n = 2 ^ s * d + 1
        let d = candidate - BigInt(1);
        let s = BigInt(0);

        while ((d & BigInt(1)) === BigInt(0)) {
            d = d >> BigInt(1);
            s++;
        }

        // Test 40 rounds.
        // Why 40 rounds? See https://stackoverflow.com/questions/6325576/how-many-iterations-of-rabin-miller-should-i-use-for-cryptographic-safe-primes
        for (let k = 0; k < 40; k++) {
            // a is a random number < candidate
            let a = BigIntMath.randBigInt() % candidate;

            // If we find a witness, number is not prime
            if (!isNotWitness(a, d, s, candidate)) {
                return false;
            }
        }

        return true;
    }
}
