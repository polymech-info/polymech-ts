import { contextBridge, ipcRenderer } from 'electron';
console.log('Preload script starting...');
try {
    console.log('Exposing electronAPI to main world...');
    // Expose APIs for React app
    contextBridge.exposeInMainWorld('electronAPI', {
        submitContent: (content) => ipcRenderer.send('content', content),
        showFileDialog: (options) => ipcRenderer.invoke('showFileDialog', options),
        showSaveDialog: (options) => ipcRenderer.invoke('showSaveDialog', options)
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
}
catch (e) {
    console.error('error preload', e);
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
        const subscription = (_event, ...args) => callback(...args);
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
window.ipcHandler = ipcHandler;
export const noop = 2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvdWkvZWxlY3Ryb24vcHJlbG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxNQUFNLFVBQVUsQ0FBQTtBQUVyRCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7QUFFMUMsSUFBSSxDQUFDO0lBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0lBQ3JELDRCQUE0QjtJQUM1QixhQUFhLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFO1FBQzdDLGFBQWEsRUFBRSxDQUFDLE9BQVksRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDO1FBQ3JFLGNBQWMsRUFBRSxDQUFDLE9BQVksRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUM7UUFDL0UsY0FBYyxFQUFFLENBQUMsT0FBWSxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQztLQUNoRixDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7SUFFaEQsdUNBQXVDO0lBQ3ZDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFDL0MsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyRCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTFELElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksVUFBVSxFQUFFLENBQUM7WUFDZixVQUFVLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO2dCQUMxQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQztBQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7SUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBQyxDQUFDLENBQUMsQ0FBQTtBQUNsQyxDQUFDO0FBQ0QsTUFBTSxVQUFVLEdBQUc7SUFDakIsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUk7UUFDakIsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUk7UUFDbkIsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFDRCxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVE7UUFDbEIsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUNELEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUTtRQUNoQixNQUFNLFlBQVksR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7UUFDM0QsV0FBVyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdEMsT0FBTyxHQUFHLEVBQUU7WUFDUixXQUFXLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUM7SUFDTixDQUFDO0lBQ0QsS0FBSyxDQUFDLE9BQU87UUFDVCxXQUFXLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGLENBQUM7QUFDRixhQUFhLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ2xELE1BQWMsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBQ3hDLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUEifQ==