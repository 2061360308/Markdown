import mitt, { Emitter } from 'mitt';

const emitter: Emitter<Record<string, unknown>> = mitt();

export enum EventBusType {
  OpenMdFile = 'OpenMdFile',
  OpenFile = 'OpenFile',
  VditorInstanceCreated = 'VditorInstanceCreated',
  FileSaved = 'FileSaved',
  FileChanged = 'FileChanged',
}

export class EventBus {
  type: EventBusType;
  emitter: Emitter<Record<string, unknown>>;

  constructor(type: EventBusType) {
    this.type = type;
    this.emitter = emitter;
  }

  on(handler: (data: any) => void) {
    this.emitter.on(this.type, handler);
  }

  off(handler: (data: any) => void) {
    this.emitter.off(this.type, handler);
  }

  emit(data: any = null) {
    this.emitter.emit(this.type, data);
  }
}