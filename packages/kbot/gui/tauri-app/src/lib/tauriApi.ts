import {
  TauriCommand,
  TauriEvent
} from '../constants';

// import { BaseDirectory } from '@tauri-apps/plugin-fs'
// Dynamically import Tauri APIs
let invoke: any;
let open: any;
let save: any;
let readFile: any;
let writeFile: any;
let readTextFile: any;
let writeTextFile: any;
let mkdir: any;
let BaseDirectory: any;
let listen: any;
let getCurrentWindow: any;
let getCurrentWebview: any;
let fetch: any;
let appConfigDir: any;
let appDataDir: any;
let join: any;
let isTauri = false;
let apiInitialized = false;
let platform: any;

const isBrowser = typeof window !== 'undefined';

const apiInitializationPromise = (async () => {
    if (!isBrowser) {
        console.log('Not in browser environment');
        platform = 'browser';
        return;
    }
    
    try {
        // Try to load Tauri APIs - if they fail, we're in browser mode
        console.log('🔍 Attempting to load Tauri APIs...');
        
        // Load all Tauri APIs in parallel for better performance
        const [
            windowApi,
            webviewApi, 
            coreApi,
            eventApi,
            dialogApi,
            fsApi,
            httpApi,
            pathApi,
            osApi
        ] = await Promise.all([
            import('@tauri-apps/api/window'),
            import('@tauri-apps/api/webview'),
            import('@tauri-apps/api/core'),
            import('@tauri-apps/api/event'),
            import('@tauri-apps/plugin-dialog'),
            import('@tauri-apps/plugin-fs'),
            import('@tauri-apps/plugin-http'),
            import('@tauri-apps/api/path'),
            import('@tauri-apps/plugin-os')
        ]);

        // Test if we can actually use the APIs (this will throw if not in Tauri)
        await windowApi.getCurrentWindow();
        
        // Debug: Check what's available in pathApi
        console.log('🔍 pathApi keys:', Object.keys(pathApi));
        console.log('🔍 pathApi.BaseDirectory:', pathApi.BaseDirectory);
        console.log('🔍 fsApi keys:', Object.keys(fsApi));
        console.log('🔍 fsApi.BaseDirectory:', fsApi.BaseDirectory);        
        //* The value is set at compile time. Possible values are `'linux'`, `'macos'`, `'ios'`, `'freebsd'`, `'dragonfly'`, `'netbsd'`, `'openbsd'`, `'solaris'`, `'android'`, `'windows'`
        console.log('🔍 osApi.platform:', osApi.platform());
        // Assign all APIs
        getCurrentWindow = windowApi.getCurrentWindow;
        getCurrentWebview = webviewApi.getCurrentWebview;
        invoke = coreApi.invoke;
        listen = eventApi.listen;
        open = dialogApi.open;
        save = dialogApi.save;
        readFile = fsApi.readFile;
        writeFile = fsApi.writeFile;
        readTextFile = fsApi.readTextFile;
        writeTextFile = fsApi.writeTextFile;
        mkdir = fsApi.mkdir;
        BaseDirectory = pathApi.BaseDirectory || fsApi.BaseDirectory;
        fetch = httpApi.fetch;
        appConfigDir = pathApi.appConfigDir;
        appDataDir = pathApi.appDataDir;
        join = pathApi.join;
        platform = osApi.platform;
        isTauri = true;
        apiInitialized = true;
        console.log('✅ All Tauri APIs loaded successfully');
    } catch (e) {
        console.warn('❌ Failed to load Tauri APIs, falling back to browser mode:', e);
        isTauri = false;
    }

    // Fallback to browser fetch if no Tauri fetch available
    if (isBrowser && !fetch) {
        fetch = window.fetch;
        console.log('🔄 Using browser fetch as fallback');
    }
    
    apiInitialized = true;
})();

export const ensureTauriApi = async () => {
    await apiInitializationPromise;
    return { isTauri, apiInitialized };
};

// Safe invoke function
export const safeInvoke = async <T>(command: TauriCommand | string, args?: any): Promise<T | null> => {
    await ensureTauriApi();
    if (isTauri && typeof invoke === 'function') {
        try {
            return await invoke(command, args);
        } catch (error) {
            console.error(`Invoke failed for command "${command}":`, error);
            return null;
        }
    } else {
        console.log(`[Browser Mode] Would invoke: ${command}`, args);
        return null;
    }
};

export { invoke, isTauri };

// Typed API wrappers
export const tauriApi = {
    ensureTauriApi,
    isTauri: () => {
        if (!apiInitialized) {
            console.warn('⚠️ Tauri API not yet initialized, returning current state');
        }
        return isTauri;
    },
    fetch: async (...args: Parameters<typeof window.fetch>): Promise<Response> => {
        await ensureTauriApi();
        const fetchFn = fetch || window.fetch;
        return fetchFn(...args);
    },
    listen: async (...args: Parameters<typeof listen>) => {
        await ensureTauriApi();
        return listen ? listen(...args) : () => {};
    },
    fs: {
        readFile: async (...args: Parameters<typeof readFile>) => {
            await ensureTauriApi();
            return readFile ? readFile(...args) : new Uint8Array();
        },
        writeFile: async (...args: Parameters<typeof writeFile>) => {
            await ensureTauriApi();
            if (writeFile) {
                return writeFile(...args);
            }
        },
        readTextFile: async (...args: Parameters<typeof readTextFile>) => {
            await ensureTauriApi();
            return readTextFile ? readTextFile(...args) : '';
        },
        writeTextFile: async (...args: Parameters<typeof writeTextFile>) => {
            await ensureTauriApi();
            if (writeTextFile) {
                return writeTextFile(...args);
            }
        },
        createDir: async (path: string, options?: { baseDir?: any; recursive?: boolean }) => {
            await ensureTauriApi();
            if (mkdir) {
                return mkdir(path, options);
            }
        },
        BaseDirectory: BaseDirectory,
    },
    dialog: {
        open: async (...args: Parameters<typeof open>) => {
            await ensureTauriApi();
            return open ? open(...args) : null;
        },
        save: async (...args: Parameters<typeof save>) => {
            await ensureTauriApi();
            return save ? save(...args) : null;
        },
    },
    path: {
        appConfigDir: async () => {
            await ensureTauriApi();
            return appConfigDir ? appConfigDir() : '';
        },
        appDataDir: async () => {
            await ensureTauriApi();
            return appDataDir ? appDataDir() : '';
        },
        join: async (...args: Parameters<typeof join>) => {
            await ensureTauriApi();
            return join ? join(...args) : '';
        },
    },
    window: {
        getCurrent: async () => {
            await ensureTauriApi();
            return getCurrentWindow ? getCurrentWindow() : null;
        },
    },
    webview: {
        getCurrent: async () => {
            await ensureTauriApi();
            return getCurrentWebview ? getCurrentWebview() : null;
        },
    },
    // Add typed wrappers for your app's specific commands
    resolvePathRelativeToHome: (absolutePath: string) =>
        safeInvoke<string>(TauriCommand.RESOLVE_PATH, { absolutePath }),

    submitPrompt: (data: { prompt: string; files: string[]; dst: string }) =>
        safeInvoke(TauriCommand.SUBMIT_PROMPT, data),

    generateImageViaBackend: (data: { prompt: string; files: string[]; dst: string }) =>
        safeInvoke(TauriCommand.GENERATE_IMAGE, data),
    
    requestConfigFromImages: () =>
        safeInvoke(TauriCommand.REQUEST_CONFIG),
    
    addDebugMessage: (message: string, level: string, data?: any) =>
        safeInvoke(TauriCommand.ADD_DEBUG_MESSAGE, { message, level, data }),

    clearDebugMessages: () =>
        safeInvoke('clear_debug_messages'),

    sendMessageToStdout: (message: string) =>
        safeInvoke('send_message_to_stdout', { message }),
    
    logErrorToConsole: (error: string) =>
        safeInvoke(TauriCommand.LOG_ERROR, { error }),

    sendIPCMessage: (messageType: string, data: any) =>
        safeInvoke(TauriCommand.SEND_IPC_MESSAGE, { messageType, data }),
    requestFileDeletion: (data: { path: string }) =>
        safeInvoke(TauriCommand.REQUEST_FILE_DELETION, data),

    parseClipboardImages: (candidateFormat: string = 'png', tempDir?: string) =>
        safeInvoke<{ success: boolean; paths?: string[]; error?: string }>('ipc_parse_clipboard_images', { 
            candidateFormat: candidateFormat, 
            tempDir: tempDir || '' 
        }),
};
