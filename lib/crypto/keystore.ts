import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    const crypto = await import('crypto');
    console.assert(app.crypto);
    app.crypto('keystore', function (ctx) {
        interface KeyStore extends Crypto {
            name(key: string): Promise<string>
        }
        interface KeyRecord {
            value: string
        }
        return <KeyStore>{
            async name(key) {
                const hash = crypto.createHash('md5');
                return hash.update(key).digest('hex');
            },
            async encrypt({ key, data }) {
                const name = await this.name(key);
                const crypto = ctx.crypto('aes-192-cbc');
                const value = await crypto.encrypt({
                    data: JSON.stringify(data),
                    key: name,
                });
                const config = ctx.config('doc');
                const document = config.document<KeyRecord>('keystore', name);
                await document.edit({
                    value: value.toString('hex'),
                });
                return name;
            },
            async decrypt({ key, data }) {
                const name = await this.name(key);
                if (name !== data) throw Error.General<Error>({
                    name: 'CryptoError',
                    message: 'mismatch',
                });

                const config = ctx.config('doc');
                const document = config.document<KeyRecord>('keystore', name);
                const record = await document.find();
                if (!record?.value) throw Error.General<Error>({
                    name: 'CryptoError',
                    message: 'missing',
                });

                const crypto = ctx.crypto('aes-192-cbc');
                const text = await crypto.decrypt({
                    data: Buffer.from(record.value, 'hex'),
                    key: name,
                });
                return JSON.parse(text.toString('utf8'));
            },
        };
    });
});
declare global {
    namespace Express {
        interface Application {
            crypto(name: 'keystore'): Crypto
        }
    }
}
interface Crypto {
    encrypt<A>(params: {
        data: A
        key: string
    }): Promise<string>
    decrypt<R>(params: {
        data: string
        key: string
    }): Promise<R>
}