import { EventEmitter } from 'events';


export type EventType = 'category' | 'post' | 'page' | 'system' | string;

export interface AppEvent {
    type: EventType;
    kind: 'cache' | 'system' | 'chat' | 'other';
    action: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
}

class AppEvents extends EventEmitter {
    private static instance: AppEvents;

    private constructor() {
        super();
        // this.setMaxListeners(10); // Default is fine now
    }

    public static getInstance(): AppEvents {
        if (!AppEvents.instance) {
            AppEvents.instance = new AppEvents();
        }
        return AppEvents.instance;
    }

    public emitUpdate(type: EventType, action: 'create' | 'update' | 'delete', data: any, kind: AppEvent['kind'] = 'cache') {
        const event: AppEvent = {
            kind,
            type,
            action,
            data,
            timestamp: Date.now()
        };
        this.emit('app-update', event);
    }
}

export const appEvents = AppEvents.getInstance();
