import { Module } from '@leo/app/instance'
export default Module(async function (app) {
    const { nanoid } = await import('nanoid');

    Object.assign(app, <Express.Application>{
        event(type) {
            return {
                once(cb) {
                    app.once(`/app/events/${type}`, cb);
                    return this;
                },
                off(cb) {
                    app.off(`/app/events/${type}`, cb);
                    return this;
                },
                on(cb) {
                    app.on(`/app/events/${type}`, cb as () => void);
                    return this;
                },
                emit(data, correlation) {
                    return app.emit(`/app/events/${type}`, {
                        id: correlation?.id ?? nanoid(9),
                        type,
                        time: correlation?.time ?? new Date(),
                        data,
                    });
                },
            };
        },
    });
});
declare global {
    namespace Express {
        interface Application {
            event<K extends keyof Events>(name: K): EventHub<K>
        }
    }
}
interface EventCallback<K extends keyof Events> {
    (e: Event<K>): void
}
interface EventHub<K extends keyof Events> {
    once(cb: EventCallback<K>): this
    off(cb: EventCallback<K>): this
    on(cb: EventCallback<K>): this
    emit(data: Event<K>['data'], correlation?: Event<any>): boolean
}
export interface Events {
}
export interface Event<K extends keyof Events> {
    readonly id: string
    readonly type: K
    readonly time: Date
    data: Events[K]
}