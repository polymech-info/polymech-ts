export interface ElectronAPI {
  submitContent: (content: any) => Promise<void>;
  showFileDialog: (options: any) => Promise<string[]>;
  showSaveDialog: (options: any) => Promise<string>;
}

export interface IPC {
  send: (channel: string, ...args: any[]) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  once: (channel: string, callback: (...args: any[]) => void) => void;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  clear: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ipc: IPC;
  }
}
