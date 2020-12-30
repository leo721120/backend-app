import { Controller } from './instance'
import { Config } from './config'

declare global {
    namespace Express {
        interface Application {
            config(name: 'fs', factory: (ctx: Express.Application) => DocumentConfig): this
            config(name: 'fs'): DocumentConfig
        }
    }
    namespace NodeJS {
        interface ProcessEnv {
            /**
            dir to save configures, default is ./.config
            */
            readonly CONFIG_HOME?: string
        }
    }
}
interface DocumentConfig {
    document<R>(...names: string[]): Config<R>
}
class FSConfig<V extends {}> implements Config<V> {
    find<K extends keyof V>(name?: K, value?: V[K]): Promise<V | V[K] | undefined> {
        return this.synchronize(async () => {
            if (name === undefined) {
                return this.findAll();
            } else {
                return this.findOne(name, value);
            }
        });
    }
    async findOne<K extends keyof V>(name: K, value?: V[K]): Promise<V[K] | undefined> {
        const data = await this.findAll();
        return data?.[name] ?? value;
    }
    async findAll(value?: V): Promise<V | undefined> {
        const { fs, log, file } = this;
        log.info('find', { file });
        const json = await fs.readFile(file).catch(function (e: NodeJS.ErrnoException) {
            if (e.code === 'ENOENT') {
                return undefined;
            }
            throw e;
        }).then(function (byte) {
            if (!byte) {
                return { data: value };
            }
            try {
                return JSON.parse(byte.toString()) as { data: V };
            } catch (e) {
                process.emit('warning', e);
                return { data: value };
            }
        });
        return json.data;
    }
    edit<K extends keyof V>(name: K | V, value?: V[K]): Promise<void> {
        return this.synchronize(async () => {
            if (value === undefined) {
                return this.editAll(name as V);
            } else {
                return this.editOne(name as K, value);
            }
        });
    }
    async editOne<K extends keyof V>(name: K, value: V[K]): Promise<void> {
        const prev = await this.findAll();
        const data = <V>{
            ...prev,
            [name]: value,
        };
        await this.editAll(data);
    }
    async editAll(data: V): Promise<void> {
        const byte = JSON.stringify(<{ data: V }>{ data }, null, '\t');
        const { fs, log, file } = this;
        log.info('edit', { file, data });
        await fs.outputFile(file, byte);
    }
    async drop<K extends keyof V>(name?: K): Promise<void> {
        return this.synchronize(async () => {
            if (name === undefined) {
                return this.dropAll();
            } else {
                return this.dropOne(name);
            }
        });
    }
    async dropOne<K extends keyof V>(name: K): Promise<void> {
        const data = await this.findAll();
        if (!data) return;
        delete data[name];
        await this.editAll(data);
    }
    async dropAll(): Promise<void> {
        const { fs, log, file } = this;
        log.info('drop', { file });
        await fs.remove(file).catch(function (e: NodeJS.ErrnoException) {
            if (e.code === 'ENOENT') {
                return;
            }
            throw e;
        });
    }
    synchronize<R>(fn: () => R | PromiseLike<R>): Promise<R> {
        return this.ctx.synchronize(this.file, fn);
    }
    constructor(
        private ctx: Express.Application,
        names: string[],
        private log = ctx.log('fs'),
        private file = names.join('/'),
        private fs = require('fs-extra') as typeof import('fs-extra'),
    ) {
    }
}
export default Controller(async function (app) {
    app.config('fs', function (ctx) {
        return <DocumentConfig>{
            document<R>(...names: string[]) {
                names.unshift(process.env.CONFIG_HOME ?? './.config');
                return new FSConfig<R>(ctx, names);
            },
        };
    });
});