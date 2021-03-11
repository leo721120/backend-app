import { BinaryLike, CipherKey } from 'crypto'
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    const crypto = await import('crypto');
    const algos: Array<{
        algorithm: Algorithms
        keylen: {
            iv: number
            key: number
        }
    }> = [{
        algorithm: 'aes-192-cbc', keylen: { iv: 16, key: 24 },
    }];
    const scrypt = async function (password: BinaryLike, salt: BinaryLike, keylen: number) {
        return new Promise<Buffer>(function (done, fail) {
            crypto.scrypt(password, salt, keylen, function (err, key) {
                err ? fail(err) : done(key);
            });
        });
    };
    for (const { algorithm, keylen } of algos) {
        console.assert(app.crypto);
        app.crypto(algorithm, function () {
            return <Crypto>{
                async encrypt({ key, data, iv }) {
                    if (!iv) {
                        const name = key.toString();
                        const salt = name;
                        const iv = await scrypt(name, salt, keylen.iv);
                        const fix = await scrypt(name, salt, keylen.key);
                        return this.encrypt({ key: fix, data, iv });
                    }

                    const cipher = crypto.createCipheriv(algorithm, key, iv);
                    const output = [cipher.update(data), cipher.final()];
                    return Buffer.concat(output);
                },
                async decrypt({ key, data, iv }) {
                    if (!iv) {
                        const name = key.toString();
                        const salt = name;
                        const iv = await scrypt(name, salt, keylen.iv);
                        const fix = await scrypt(name, salt, keylen.key);
                        return this.decrypt({ key: fix, data, iv });
                    }

                    const cipher = crypto.createDecipheriv(algorithm, key, iv);
                    const output = [cipher.update(data), cipher.final()];
                    return Buffer.concat(output);
                },
            };
        });
    }
});
declare global {
    namespace Express {
        interface Application {
            crypto(name: Algorithms): Crypto
        }
    }
}
export type Algorithms =
    //| import('crypto').CipherCCMTypes
    //| import('crypto').CipherGCMTypes
    | 'aes-192-cbc'
interface Crypto {
    encrypt(params: {
        data: BinaryLike
        key: CipherKey
        iv?: BinaryLike
    }): Promise<Buffer>
    decrypt(params: {
        data: NodeJS.ArrayBufferView
        key: CipherKey
        iv?: BinaryLike
    }): Promise<Buffer>
}