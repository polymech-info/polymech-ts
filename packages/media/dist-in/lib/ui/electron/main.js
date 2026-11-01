//https://rjsf-team.github.io/react-jsonschema-form/
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { dialog } from 'electron';
let _files = [];
let _dst = '';
let _config = {};
function createWindow() {
    console.log('Creating Electron window...');
    // Try with minimal options first
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 800,
        show: false, // Start hidden, show after load
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        },
    });
    console.log('Window created successfully!');
    // Check if we have a built React app
    const reactDistPath = path.resolve('./web-ui/dist/index.html');
    const legacyHtmlPath = path.resolve('./web-ui/prompt.html');
    if (fs.existsSync(reactDistPath)) {
        console.log('Loading React app from:', reactDistPath);
        mainWindow.loadFile(reactDistPath);
    }
    else if (fs.existsSync(legacyHtmlPath)) {
        console.log('Loading legacy HTML from:', legacyHtmlPath);
        mainWindow.loadFile(legacyHtmlPath);
    }
    else {
        console.log('No UI files found, trying dev server...');
        // Try to load dev server
        mainWindow.loadURL('http://localhost:5173').catch((error) => {
            console.log('Dev server not available, showing error page');
            // If dev server not available, show error
            mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
                <html>
                <body style="font-family: Arial; padding: 20px;">
                    <h2>UI Not Available</h2>
                    <p>React app not built and dev server not running.</p>
                    <p>Please build the React app:</p>
                    <pre>cd web-ui && npm run build</pre>
                    <p>or start the dev server:</p>
                    <pre>cd web-ui && npm run dev</pre>
                    <p>Error: ${error.message}</p>
                </body>
                </html>
            `));
        });
    }
    // Add event listeners to see what's happening
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully');
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.openDevTools(); // Open dev tools to see what's happening
    });
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.log('Page failed to load:', errorCode, errorDescription);
        mainWindow.show(); // Show window even on error
    });
    // Force window to be visible immediately
    mainWindow.show();
    mainWindow.focus();
    // Prevent window from closing immediately
    mainWindow.on('close', (event) => {
        console.log('Window is trying to close');
    });
    return mainWindow;
    // Handle React app config requests
    ipcMain.on('request-config', (event) => {
        event.reply('app-config', _config);
    });
    // Handle form submission from React app
    ipcMain.on('content', (_event, content) => {
        console.log(JSON.stringify({
            type: 'content',
            ...content,
            files: _files,
            target: _dst
        }));
        mainWindow.close();
        app.exit();
    });
    // Handle cancel from React app
    ipcMain.on('cancel', () => {
        console.log(JSON.stringify({ type: 'cancelled' }));
        mainWindow.close();
        app.exit();
    });
    // Keep window open for at least 5 seconds for debugging
    setTimeout(() => {
        console.log('Window has been open for 5 seconds');
    }, 5000);
    // New IPC handlers for file dialogs
    ipcMain.handle('showFileDialog', async (event, options) => {
        console.log('File dialog requested with options:', options);
        try {
            const result = await dialog.showOpenDialog(mainWindow, options);
            console.log('File dialog result:', result);
            if (!result.canceled) {
                _files = result.filePaths;
                return result.filePaths;
            }
            return [];
        }
        catch (error) {
            console.error('File dialog error:', error);
            return [];
        }
    });
    ipcMain.handle('showSaveDialog', async (event, options) => {
        console.log('Save dialog requested with options:', options);
        try {
            const result = await dialog.showSaveDialog(mainWindow, options);
            console.log('Save dialog result:', result);
            if (!result.canceled) {
                _dst = result.filePath;
                return result.filePath;
            }
            return null;
        }
        catch (error) {
            console.error('Save dialog error:', error);
            return null;
        }
    });
    // Legacy handlers for backward compatibility
    ipcMain.on('filePicker', (_event, content) => {
        const files = dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
        files.then((fp) => {
            _files = fp.filePaths;
        });
        return files;
    });
}
console.log('Electron app starting...');
app.whenReady().then(() => {
    console.log('Electron app ready');
    // Check for config file argument
    const args = process.argv;
    console.log('Args:', args);
    const configArg = args.find(arg => arg.startsWith('--config='));
    if (configArg) {
        const configPath = configArg.split('=')[1].replace(/"/g, '');
        console.log('Loading config from:', configPath);
        try {
            if (fs.existsSync(configPath)) {
                const configData = fs.readFileSync(configPath, 'utf8');
                _config = JSON.parse(configData);
                console.log('Loaded config:', _config);
            }
            else {
                console.log('Config file not found:', configPath);
            }
        }
        catch (e) {
            console.error('Error loading config:', e);
        }
    }
    else {
        console.log('No config argument provided');
    }
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
// Export function to set config from external calls
export const setUIConfig = (config) => {
    _config = config;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvdWkvZWxlY3Ryb24vbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxvREFBb0Q7QUFFcEQsT0FBTyxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLE1BQU0sVUFBVSxDQUFBO0FBQ3RELE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBQzVCLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBQ3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxVQUFVLENBQUE7QUFFakMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFBO0FBQ2YsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQ2IsSUFBSSxPQUFPLEdBQVEsRUFBRSxDQUFBO0FBRXJCLFNBQVMsWUFBWTtJQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFFM0MsaUNBQWlDO0lBQ2pDLE1BQU0sVUFBVSxHQUFHLElBQUksYUFBYSxDQUFDO1FBQ2pDLEtBQUssRUFBRSxHQUFHO1FBQ1YsTUFBTSxFQUFFLEdBQUc7UUFDWCxJQUFJLEVBQUUsS0FBSyxFQUFFLGdDQUFnQztRQUM3QyxjQUFjLEVBQUU7WUFDWixlQUFlLEVBQUUsS0FBSztZQUN0QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLFdBQVcsRUFBRSxJQUFJO1NBQ3BCO0tBQ0osQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBRTVDLHFDQUFxQztJQUNyQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUE7SUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0lBRTNELElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxD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