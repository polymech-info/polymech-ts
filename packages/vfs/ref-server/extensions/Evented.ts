import { SyncEvent } from 'ts-events';
export class Evented {
    events: any = {};
    private _event(event: string) {
        let _event: SyncEvent<any> = this.events[event];
        if (!_event) {
            _event = new SyncEvent<any>();
            this.events[event] = _event;
        }
        return _event;
    }
    public emit(event: string, data: any): void {
        const seven: SyncEvent<any> = this._event(event);
        seven.post(data);
    }
    public on(event: string, handler: any): void {
        let _event: SyncEvent<any> = this.events[event];
        if (!_event) {
            _event = new SyncEvent<any>();
            this.events[event] = _event;
        }
        _event.attach(handler);
    }
}