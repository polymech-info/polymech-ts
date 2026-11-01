//https://rjsf-team.github.io/react-jsonschema-form/

import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { dialog } from 'electron'

let _files = []
let _dst = ''
let _config: any = {}

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
    const reactDistPath = path.resolve('./web-ui/dist/index.html')
    const legacyHtmlPath = path.resolve('./web-ui/prompt.html')
    
    if (fs.existsSync(reactDistPath)) {
        console.log('Loading React app from:', reactDistPath)
        mainWindow.loadFile(reactDistPath)
    } else if (fs.existsSync(legacyHtmlPath)) {
        console.log('Loading legacy HTML from:', legacyHtmlPath)
        mainWindow.loadFile(legacyHtmlPath)
    } else {
        console.log('No UI files found, trying dev server...')
        // Try to load dev server
        mainWindow.loadURL('http://localhost:5173').catch((error) => {
            console.log('Dev server not available, showing error page')
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
            `))
        })
    }
    
    // Add event listeners to see what's happening
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully')
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.openDevTools() // Open dev tools to see what's happening
    })
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.log('Page failed to load:', errorCode, errorDescription)
        mainWindow.show() // Show window even on error
    })
    
    // Force window to be visible immediately
    mainWindow.show()
    mainWindow.focus()
    
    // Prevent window from closing immediately
    mainWindow.on('close', (event) => {
        console.log('Window is trying to close')
    })
    
    return mainWindow
    // Handle React app config requests
    ipcMain.on('request-config', (event) => {
        event.reply('app-config', _config)
    })

    // Handle form submission from React app
    ipcMain.on('content', (_event, content) => {
        console.log(JSON.stringify({
            type: 'content',
            ...content,
            files: _files,
            target: _dst
        }))
        mainWindow.close()
        app.exit()
    })

    // Handle cancel from React app
    ipcMain.on('cancel', () => {
        console.log(JSON.stringify({ type: 'cancelled' }))
        mainWindow.close()
        app.exit()
    })
    
    // Keep window open for at least 5 seconds for debugging
    setTimeout(() => {
        console.log('Window has been open for 5 seconds')
    }, 5000)

    // New IPC handlers for file dialogs
    ipcMain.handle('showFileDialog', async (event, options) => {
        console.log('File dialog requested with options:', options)
        try {
            const result = await dialog.showOpenDialog(mainWindow, options)
            console.log('File dialog result:', result)
            if (!result.canceled) {
                _files = result.filePaths
                return result.filePaths
            }
            return []
        } catch (error) {
            console.error('File dialog error:', error)
            return []
        }
    });

    ipcMain.handle('showSaveDialog', async (event, options) => {
        console.log('Save dialog requested with options:', options)
        try {
            const result = await dialog.showSaveDialog(mainWindow, options)
            console.log('Save dialog result:', result)
            if (!result.canceled) {
                _dst = result.filePath
                return result.filePath
            }
            return null
        } catch (error) {
            console.error('Save dialog error:', error)
            return null
        }
    });

    // Legacy handlers for backward compatibility
    ipcMain.on('filePicker', (_event, content) => {
        const files = dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] })
        files.then((fp) => {
            _files = fp.filePaths
        })
        return files
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
            } else {
                console.log('Config file not found:', configPath);
            }
        } catch (e) {
            console.error('Error loading config:', e);
        }
    } else {
        console.log('No config argument provided');
    }
    
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Export function to set config from external calls
export const setUIConfig = (config: any) => {
    _config = config;
};