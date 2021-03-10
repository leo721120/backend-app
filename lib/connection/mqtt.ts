import { Module } from '@leo/app/instance'
import { EventEmitter } from 'events'
export default Module(async function (app) {
    app.connection('mqtt', function (ctx) {
        return new MQTTConnection(ctx);
    });
});
declare global {
    namespace Express {
        interface Application {
            connection(name: 'mqtt'): Connection
        }
    }
}
interface Response {
    waitForReply(milliseconds: number): Promise<this>
}
interface Request {
    topic: string
    payload: Buffer
    qos?: 0 | 1
}
interface Topics {
    [topic: string]: unknown
}
interface Callback<K extends keyof Topics> {
    (payload: Topics[K]): void
}
export interface Connection {
    readonly info?: Readonly<import('mqtt').IClientOptions & {
        subscribe?: {
            [topic: string]: {
                intercept?(payload: Buffer): unknown
                qos: 0 | 1
            }
        }
    }>
    publish(req: Request): Promise<Response>
    connect(connection: Required<Connection>['info']): Promise<[]>
    close(): Promise<void>
    emit<K extends keyof Topics>(topic: K, payload: Topics[K]): boolean
    once<K extends keyof Topics>(topic: K, cb: Callback<K>): this
    off<K extends keyof Topics>(topic: K, cb: Callback<K>): this
    on<K extends keyof Topics>(topic: K, cb: Callback<K>): this
    emit(topic: '#', payload: Buffer, packet: { topic: string }): boolean
    off(topic: '#', cb: (payload: Buffer, packet: { topic: string }) => void): this
    on(topic: '#', cb: (payload: Buffer, packet: { topic: string }) => void): this
}
class MQTTConnection extends EventEmitter implements Connection {
    get info() {
        return this.client?.options;
    }
    publish(req: Request): Promise<Response> {
        return Promise.lazy(async () => {
            new Promise<{}>((done, fail) => {
                console.assert(this.client);
                this.client!.publish(req.topic, req.payload, req, function (err, packet) {
                    err ? fail(err) : done(packet as {});
                });
            });
            return {
                waitForReply(ms) {
                    return new Promise(function (done) {
                        setTimeout(done, ms);
                    });
                },
            };
        });
    }
    connect(connection: Required<Connection>['info']): Promise<[]> {
        return Promise.lazy(async () => {
            await this.close();

            const { connect } = await import('mqtt');
            console.assert(!this.client);
            this.client = connect(null, {
                resubscribe: true,
                protocol: 'mqtt',
                port: 1883,
                ...connection,
            }).on('error', (e) => {
                this.log.error(e);
            }).on('connect', (e) => {
                this.log.info('connect', e);
            }).on('reconnect', () => {
                this.log.info('reconnect');
            }).on('disconnect', (e: unknown) => {
                this.log.info('disconnect', e);
            }).on('offline', (e: unknown) => {
                this.log.info('offline', e);
            }).on('end', () => {
                this.log.info('end');
            }).on('packetsend', (e) => {
                this.log.info('send', {
                    ...e,
                    payload: '<buffer>',
                });
            }).on('packetreceive', (e) => {
                this.log.info('recv', {
                    ...e,
                    payload: '<buffer>',
                });
            }).on('message', (topic, payload) => {
                const connection = this as Connection;
                const intercept = connection.info?.subscribe?.[topic]?.intercept ?? function (a) {
                    return a;
                };
                const data = intercept(payload);
                this.emit(topic, data);
                this.emit('#', data, { topic });
            });
            const topics = this.eventNames().map(function (topic) {
                return [topic, {
                    qos: 0,
                }];
            });
            return new Promise<[]>((done, fail) => {
                console.assert(this.client);
                this.client!.subscribe({
                    ...Object.fromEntries(topics),
                    ...connection.subscribe,
                }, (err, grants) => {
                    err ? fail(err) : done(grants as []);
                });
            });
        });
    }
    close(): Promise<void> {
        return Promise.lazy(async () => {
            if (!this.client) {
                return;
            }

            return new Promise((done) => {
                console.assert(this.client);
                this.client!.end(true, {}, done);
                this.client = undefined;
            });
        });
    }
    emit = super.emit as (topic: unknown, payload: unknown, options?: unknown) => boolean
    once = super.once as () => this
    off = super.off as () => this
    on = super.on as () => this
    constructor(
        private app: Express.Application,
        private log = app.log('mqtt'),
    ) {
        super();
        this.app;
    }
    private client?: import('mqtt').Client;
}