import { Event, Events } from '@leo/lib/event'
import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    const subscriptions = new Map<string, Subscription>();
    const subscribables: Array<keyof Events> = [
        'HttpClose',
        'abc' as any,
    ];
    app.post('/events/subscription', app.express.json(), function (req, res) {
        const id = 'abc123';
        const ctx = req.ctx();
        const events = subscribables.map(function (type) {
            return ctx.event(type);
        });
        if (subscriptions.has(id)) throw Error.General<Error>({
            message: 'ready exist',
            name: 'HttpError',
            status: 400,
        });
        subscriptions.set(id, {
            disconnect() {
            },
            unsubscribe() {
            },
            subscribe(socket) {
                const sse = {
                    id(id: string) {
                        socket.write(`id: ${id}\n`);
                    },
                    event(type: string) {
                        socket.write(`event: ${type}\n`);
                    },
                    retry(ms: number) {
                        socket.write(`retry: ${ms}\n`);
                    },
                    data(text: string) {
                        socket.write(`data: ${text}\n\n`);
                    },
                    json(data: unknown) {
                        return this.data(JSON.stringify(data));
                    },
                };
                const cb = function (e: unknown) {
                    if (socket.writable) {
                        sse.json({
                            events: [e],
                        });
                    }
                };
                this.unsubscribe = function () {
                    subscriptions.delete(id);
                    events.forEach(function (event) {
                        event.off(cb);
                    });
                };
                this.disconnect = function () {
                    socket.end();
                };
                events.forEach(function (event) {
                    event.on(cb);
                });
            },
        });
        res.status(201).send({
            subscription: {
                id,
                url: `/events/subscription/${id}`,
            },
        });
    }).get('/events/subscription/:id', function (req, res) {
        const log = req.log();
        const { id } = req.params;
        const subscription = subscriptions.get(id);
        if (!subscription) throw Error.General<Error>({
            message: 'not exist',
            name: 'HttpError',
            status: 404,
        });
        res.once('close', function () {
            log.info(`close`, {
                subscription: {
                    id,
                },
            });
            subscription.unsubscribe();
        });
        subscription.subscribe(res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
        }));
    }).delete('/events/subscription/:id', function (req, res) {
        const { id } = req.params;
        const subscription = subscriptions.get(id);
        if (!subscription) return res.status(204).end();
        subscription.unsubscribe();
        subscription.disconnect();
        res.status(200).send({
            subscription: {
                id,
            },
        });
    }).post('/events/echo', app.express.json(), function (req, res) {
        const ctx = req.ctx();
        const body = req.body as {
            events: Array<Event<'HttpClose'>>
        };
        body.events.forEach(function (e) {
            const event = ctx.event(e.type);
            event.emit(e.data);
        });
        res.status(204).end();
    });
});
interface Subscription {
    disconnect(): void
    unsubscribe(): void
    subscribe(socket: NodeJS.WritableStream): void
}