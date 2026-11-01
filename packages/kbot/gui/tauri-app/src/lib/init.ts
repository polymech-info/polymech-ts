import { tauriApi } from './tauriApi';
import { PromptTemplate } from '../types';
import log from './log';

export interface InitConfig {
  prompt?: string;
  dst?: string;
  apiKey?: string;
  files?: string[];
}

export interface InitState {
  isInitialized: boolean;
  isTauriEnv: boolean;
  apiInitialized: boolean;
  config: InitConfig | null;
  prompts: PromptTemplate[];
  error: string | null;
}

export interface InitCallbacks {
  setPrompt: (prompt: string) => void;
  setDst: (dst: string) => void;
  setApiKey: (key: string) => void;
  setPrompts: (prompts: PromptTemplate[]) => void;
  setIpcInitialized: (initialized: boolean) => void;
  setPromptHistory?: (history: string[]) => void;
  setFileHistory?: (fileHistory: string[]) => void;
}

const STORE_FILE_NAME = '.kbot-gui.json';

/**
 * Step 1: Initialize Tauri APIs
 */
export async function initAPI(): Promise<{ isTauri: boolean; apiInitialized: boolean }> {
  log.info('🚀 Starting API initialization...');
  
  try {
    const result = await tauriApi.ensureTauriApi();
    
    log.info('✅ API initialization complete', {
      isTauri: result.isTauri,
      apiInitialized: result.apiInitialized,
      windowTauri: !!(window as any).__TAURI__
    });
    
    return result;
  } catch (error) {
    log.error('❌ API initialization failed', { 
      error: (error as Error).message 
    });
    throw error;
  }
}

/**
 * Step 2: Get configuration from images.ts backend
 */
export async function getConfig(): Promise<void> {
  log.info('📡 Requesting config from images.ts...');
  
  try {
    await tauriApi.requestConfigFromImages();
    log.info('📤 Config request sent to images.ts');
  } catch (error) {
    log.error('❌ Failed to request config', { 
      error: (error as Error).message 
    });
    throw error;
  }
}

/**
 * Step 3: Load prompts store after config is received
 */
export async function loadStore(
  callbacks: Pick<InitCallbacks, 'setPrompts' | 'setApiKey'>,
  setPromptHistory?: (history: string[]) => void,
  setFileHistory?: (fileHistory: string[]) => void
): Promise<PromptTemplate[]> {
  const { setPrompts, setApiKey } = callbacks;
  
  log.debug('🔄 Loading prompts from store...');
  
  try {
    const { isTauri: isTauriEnv } = await tauriApi.ensureTauriApi();
    
    if (!isTauriEnv) {
      log.warn('🌐 Not in Tauri environment, skipping store load');
      return [];
    }
    
    log.info('📂 Attempting to load prompts from store...');
    
    // Try BaseDirectory approach first
    const BaseDir = tauriApi.fs.BaseDirectory;
    let content: string;
    
    if (BaseDir && BaseDir.AppData !== undefined) {
      log.debug(`📄 Reading store using BaseDirectory.AppData`);
      content = await tauriApi.fs.readTextFile(STORE_FILE_NAME, { baseDir: BaseDir.AppData });
    } else {
      // Fallback to absolute path
      const configDir = await tauriApi.path.appDataDir();
      const storePath = await tauriApi.path.join(configDir, STORE_FILE_NAME);
      log.debug(`📄 Reading store using absolute path: ${storePath}`);
      content = await tauriApi.fs.readTextFile(storePath);
    }
    
    if (content) {
      const data = JSON.parse(content);
      log.debug(`📋 Parsed store data:`, data);
      
      if (data.prompts && Array.isArray(data.prompts)) {
        setPrompts(data.prompts);
        
        // Load history if available
        if (data.history && Array.isArray(data.history) && setPromptHistory) {
          setPromptHistory(data.history);
        }
        
        // Load file history if available
        if (data.fileHistory && Array.isArray(data.fileHistory) && setFileHistory) {
          log.debug(`Setting file history with ${data.fileHistory.length} files`, {
            files: data.fileHistory.map((f: string) => f.split(/[/\\]/).pop())
          });
          setFileHistory(data.fileHistory);
        }
        
        // Load API key if available
        if (data.apiKey && typeof data.apiKey === 'string') {
          setApiKey(data.apiKey);
        }
        
        log.info(`✅ Loaded ${data.prompts.length} prompts, ${data.history?.length || 0} history entries, ${data.fileHistory?.length || 0} file history entries, ${data.apiKey ? 'API key' : 'no API key'} from store`);
        
        return data.prompts;
      } else {
        log.warn('⚠️ Store file exists but has no valid prompts array');
        return [];
      }
    } else {
      log.info('📭 Store file is empty');
      return [];
    }
    
  } catch (error) {
    const err = error as Error;
    log.info(`📂 Prompt store not found, creating initial store...`, { 
      error: err.message,
      storePath: STORE_FILE_NAME
    });
    
    // Create initial empty store
    try {
      const initialPrompts: PromptTemplate[] = [];
      
      // Use BaseDirectory.AppData approach for better compatibility
      const BaseDir = tauriApi.fs.BaseDirectory;
      log.debug(`📁 BaseDirectory available:`, BaseDir ? Object.keys(BaseDir) : 'none');
      
      const initialData = JSON.stringify({ prompts: initialPrompts }, null, 2);
      
      // Try to write using BaseDirectory first (most reliable)
      if (BaseDir && BaseDir.AppData !== undefined) {
        log.debug(`💾 Writing store using BaseDirectory.AppData (value: ${BaseDir.AppData})`);
        await tauriApi.fs.writeTextFile(STORE_FILE_NAME, initialData, { baseDir: BaseDir.AppData });
        log.info(`✅ Initial store created successfully using BaseDirectory.AppData`);
      } else {
        // Fallback to absolute path approach with directory creation
        const configDir = await tauriApi.path.appDataDir();
        const storePath = await tauriApi.path.join(configDir, STORE_FILE_NAME);
        log.debug(`💾 Writing store using absolute path: ${storePath}`);
        
        // Try to create the directory first using mkdir
        try {
          await tauriApi.fs.createDir(configDir, { recursive: true });
          log.debug(`✅ Directory created: ${configDir}`);
        } catch (dirError) {
          log.debug(`📁 Directory creation failed or already exists: ${(dirError as Error).message}`);
        }
        
        // Now try to write the file
        await tauriApi.fs.writeTextFile(storePath, initialData);
        log.info(`✅ Initial store created successfully at ${storePath}`);
      }
      
      setPrompts(initialPrompts);
      return initialPrompts;
    } catch (createError) {
      const configDir = await tauriApi.path.appDataDir().catch(() => 'unknown');
      log.error('Failed to create initial store - directory may not exist', { 
        error: (createError as Error).message,
        errorName: (createError as Error).name,
        storePath: STORE_FILE_NAME,
        configDir,
        note: 'You may need to manually create the APPDATA directory first'
      });
      return [];
    }
  }
}

/**
 * Process received config data and update state
 */
export function processConfig(
  configData: any, 
  callbacks: Pick<InitCallbacks, 'setPrompt' | 'setDst' | 'setApiKey' | 'setIpcInitialized'>
): InitConfig {
  const { setPrompt, setDst, setApiKey, setIpcInitialized } = callbacks;
  
  const config: InitConfig = {};
  
  if (configData.prompt) {
    config.prompt = configData.prompt;
    setPrompt(configData.prompt);
  }
  if (configData.dst) {
    config.dst = configData.dst;
    setDst(configData.dst);
  }
  if (configData.apiKey) {
    config.apiKey = configData.apiKey;
    setApiKey(configData.apiKey);
  }
  if (configData.files) {
    config.files = configData.files;
  }
  
  setIpcInitialized(true);
  // Mark IPC as ready for logging system
  log.setIpcReady(true);
  
  log.info('📨 Config processed successfully', {
    hasPrompt: !!config.prompt,
    hasDst: !!config.dst,
    hasApiKey: !!config.apiKey,
    fileCount: config.files?.length || 0,
  });
  
  return config;
}

/**
 * Complete initialization flow
 */
export async function initializeApp(callbacks: InitCallbacks): Promise<InitState> {
  // Initialize logging system first
  log.initLogging();
  
  const state: InitState = {
    isInitialized: false,
    isTauriEnv: false,
    apiInitialized: false,
    config: null,
    prompts: [],
    error: null
  };
  
  try {
    log.info('🎯 Starting complete app initialization...');
    
    // Step 1: Initialize APIs
    const apiResult = await initAPI();
    state.isTauriEnv = apiResult.isTauri;
    state.apiInitialized = apiResult.apiInitialized;
    
    if (state.isTauriEnv) {
      // Step 2: Request config (this will trigger CONFIG_RECEIVED event)
      await getConfig();
    } else {
      log.warn('🌐 Running in browser mode, skipping config request');
      state.isInitialized = true;
    }
    
  } catch (error) {
    const err = error as Error;
    state.error = err.message;
    log.error('❌ App initialization failed', { 
      error: err.message,
      step: 'initialization'
    });
  }
  
  return state;
}

/**
 * Complete the initialization after config is received
 */
export async function completeInitialization(
  configData: any,
  callbacks: InitCallbacks
): Promise<{ config: InitConfig; prompts: PromptTemplate[] }> {
  try {
    
    // Process the received config
    const config = processConfig(configData, callbacks);
    
    // Load the prompts store  
    const prompts = await loadStore(callbacks, callbacks.setPromptHistory, callbacks.setFileHistory);
    
    return { config, prompts };
    
  } catch (error) {
    const err = error as Error;
    log.error('❌ Failed to complete initialization', { 
      error: err.message 
    });
    throw error;
  }
}

/**
 * Save specific data to store (merges with existing)
 */
export async function saveToStore(updates: { 
  prompts?: PromptTemplate[], 
  history?: string[], 
  fileHistory?: string[],
  apiKey?: string
}): Promise<void> {
  const { isTauri: isTauriEnv } = await tauriApi.ensureTauriApi();
  
  if (!isTauriEnv) {
    log.warn('🌐 Not in Tauri, cannot save prompts');
    return;
  }
  
  try {
    log.debug('💾 Starting save prompts process...');
    
    // Try BaseDirectory approach first
    const BaseDir = tauriApi.fs.BaseDirectory;
    
    // Load existing data first to merge
    let existingData = { prompts: [], history: [], fileHistory: [], apiKey: '' };
    try {
      let existingContent: string;
      if (BaseDir && BaseDir.AppData !== undefined) {
        existingContent = await tauriApi.fs.readTextFile(STORE_FILE_NAME, { baseDir: BaseDir.AppData });
      } else {
        const dataDir = await tauriApi.path.appDataDir();
        const storePath = await tauriApi.path.join(dataDir, STORE_FILE_NAME);
        existingContent = await tauriApi.fs.readTextFile(storePath);
      }
      if (existingContent) {
        const parsed = JSON.parse(existingContent);
        // Ensure all fields exist with defaults
        existingData = {
          prompts: parsed.prompts || [],
          history: parsed.history || [],
          fileHistory: parsed.fileHistory || [],
          apiKey: parsed.apiKey || ''
        };
      }
    } catch (loadError) {
      log.debug('No existing store to merge with');
    }
    
    // Merge with existing data - only update provided fields
    const mergedData = {
      prompts: updates.prompts !== undefined ? updates.prompts : existingData.prompts || [],
      history: updates.history !== undefined ? updates.history : existingData.history || [],
      fileHistory: updates.fileHistory !== undefined ? updates.fileHistory : existingData.fileHistory || [],
      apiKey: updates.apiKey !== undefined ? updates.apiKey : existingData.apiKey || ''
    };
    
    const dataToSave = JSON.stringify(mergedData, null, 2);
    log.debug(`💾 Data to save:`, { 
      promptCount: mergedData.prompts.length,
      historyCount: mergedData.history.length,
      fileHistoryCount: mergedData.fileHistory.length,
      hasApiKey: !!mergedData.apiKey,
      apiKeyLength: mergedData.apiKey?.length || 0,
      dataLength: dataToSave.length,
      updates: Object.keys(updates)
    });
    
    console.log('🔍 Store merge debug:', {
      existingApiKey: !!existingData.apiKey,
      newApiKey: !!updates.apiKey,
      finalApiKey: !!mergedData.apiKey,
      existingPrompts: existingData.prompts.length,
      finalPrompts: mergedData.prompts.length
    });
    
    // Write using the same approach as loading
    if (BaseDir && BaseDir.AppData !== undefined) {
      await tauriApi.fs.writeTextFile(STORE_FILE_NAME, dataToSave, { baseDir: BaseDir.AppData });
    } else {
      const dataDir = await tauriApi.path.appDataDir();
      const storePath = await tauriApi.path.join(dataDir, STORE_FILE_NAME);
      
      // Ensure directory exists before writing
      try {
        await tauriApi.fs.createDir(dataDir, { recursive: true });
        log.debug(`✅ Directory ensured: ${dataDir}`);
      } catch (dirError) {
        log.debug(`📁 Directory creation failed or already exists: ${(dirError as Error).message}`);
      }
      
      await tauriApi.fs.writeTextFile(storePath, dataToSave);
    }
    log.info(`✅ Store saved with ${mergedData.prompts.length} prompts, ${mergedData.history.length} history, ${mergedData.fileHistory.length} files`);
  } catch (error) {
    log.error('Failed to save prompts', { 
      error: (error as Error).message,
      errorName: (error as Error).name,
      errorStack: (error as Error).stack
    });
    throw error;
  }
}
