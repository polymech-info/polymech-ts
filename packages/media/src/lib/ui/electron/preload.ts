import { contextBridge, ipcRenderer } from 'electron'

console.log('Preload script starting...');

try {
  console.log('Exposing electronAPI to main world...');
  // Expose APIs for React app
  contextBridge.exposeInMainWorld('electronAPI', {
    submitContent: (content: any) => ipcRenderer.send('content', content),
    showFileDialog: (options: any) => ipcRenderer.invoke('showFileDialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('showSaveDialog', options)
  });
  console.log('electronAPI exposed successfully');

  // Legacy support for old HTML template
  window.addEventListener("DOMContentLoaded", () => {
    const okButton = document.getElementById("okButton");
    const filePicker = document.getElementById("_filePicker");
    
    if (okButton) {
      okButton.addEventListener("click", () => {
        console.log('Legacy OK button clicked');
      });
    }

    if (filePicker) {
      filePicker.addEventListener("click", () => {
        console.log('Legacy file picker clicked');
        ipcHandler.send('filePicker');
      });
    }
  });
  
} catch (e) {
  console.error('error preload',e)
}
const ipcHandler = {
  send(channel, ...args) {
      ipcRenderer.send(channel, ...args);
  },
  invoke(channel, ...args) {
      return ipcRenderer.invoke(channel, ...args);
  },
  once(channel, callback) {
      ipcRenderer.once(channel, (_event, ...args) => callback(...args));
  },
  on(channel, callback) {
      const subscription = (_event, ...args) => callback(...args)
      ipcRenderer.on(channel, subscription);
      return () => {
          ipcRenderer.removeListener(channel, subscription);
      };
  },
  clear(channel) {
      ipcRenderer.removeAllListeners(channel);
  }
};
contextBridge.exposeInMainWorld('ipc', ipcHandler);
(window as any).ipcHandler = ipcHandler;
export const noop = 2
