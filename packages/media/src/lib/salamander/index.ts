import * as fs from 'fs';
import * as path from 'path';
import regedit from 'regedit';

const promisified = regedit.promisified;

export interface SalamanderMenuItem {
  name: string;
  command?: string;
  arguments?: string;
  initialDirectory?: string;
  executeThoughShell?: boolean;
  closeShellWindow?: boolean;
  openShellWindow?: boolean;
  icon?: string;
  showInToolbar?: boolean;
  type?: 'command' | 'submenu' | 'submenu-end';
  children?: SalamanderMenuItem[];
}

export interface SalamanderMenuConfig {
  baseKey: string;
  startIndex: number;
  items: SalamanderMenuItem[];
}

export interface RegistryEntry {
  key: string;
  values: Record<string, string | number>;
}

export class SalamanderMenuGenerator {
  private baseKey: string = 'HKEY_CURRENT_USER\\Software\\Altap\\Altap Salamander 4.0\\User Menu';
  
  constructor(private config: SalamanderMenuConfig) {
    if (config.baseKey) {
      this.baseKey = config.baseKey;
    }
  }

  /**
   * Parse existing registry file to find the highest menu index
   */
  static parseExistingRegistry(registryPath: string): number {
    if (!fs.existsSync(registryPath)) {
      return 0;
    }

    const content = fs.readFileSync(registryPath, 'utf8');
    const lines = content.split('\n');
    let maxIndex = 0;

    for (const line of lines) {
      const match = line.match(/\\User Menu\\(\d+)\]/);
      if (match) {
        const index = parseInt(match[1], 10);
        if (index > maxIndex) {
          maxIndex = index;
        }
      }
    }

    return maxIndex;
  }

  /**
   * Generate registry entries from menu configuration
   */
  generateRegistryEntries(): RegistryEntry[] {
    const entries: RegistryEntry[] = [];
    let currentIndex = this.config.startIndex;

    const processItems = (items: SalamanderMenuItem[], isSubMenu = false) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          // Submenu start
          entries.push({
            key: `[${this.baseKey}\\${currentIndex}]`,
            values: this.itemToRegistryValues(item, 'submenu')
          });
          currentIndex++;

          // Process children
          processItems(item.children, true);

          // Submenu end
          entries.push({
            key: `[${this.baseKey}\\${currentIndex}]`,
            values: {
              '"Item Name"': '"(Submenu End)"',
              '"Command"': '""',
              '"Arguments"': '""',
              '"Initial Directory"': '""',
              '"Execute Through Shell"': 'dword:00000000',
              '"Close Shell Window"': 'dword:00000000',
              '"Open Shell Window"': 'dword:00000000',
              '"Icon"': '""',
              '"Type"': 'dword:00000002',
              '"Show In Toolbar"': 'dword:00000000'
            }
          });
          currentIndex++;
        } else {
          // Regular command
          entries.push({
            key: `[${this.baseKey}\\${currentIndex}]`,
            values: this.itemToRegistryValues(item, 'command')
          });
          currentIndex++;
        }
      }
    };

    processItems(this.config.items);
    return entries;
  }

  /**
   * Convert menu item to registry values
   */
  private itemToRegistryValues(item: SalamanderMenuItem, type: 'command' | 'submenu'): Record<string, string | number> {
    const values: Record<string, string | number> = {
      '"Item Name"': `"${item.name}"`,
      '"Command"': `"${item.command || ''}"`,
      '"Arguments"': `"${this.escapeArguments(item.arguments || '')}"`,
      '"Initial Directory"': `"${item.initialDirectory || ''}"`,
      '"Execute Through Shell"': item.executeThoughShell !== false ? 'dword:00000001' : 'dword:00000000',
      '"Close Shell Window"': item.closeShellWindow === true ? 'dword:00000001' : 'dword:00000000',
      '"Open Shell Window"': item.openShellWindow !== false ? 'dword:00000001' : 'dword:00000000',
      '"Icon"': `"${item.icon || ''}"`,
      '"Type"': type === 'submenu' ? 'dword:00000001' : 'dword:00000000',
      '"Show In Toolbar"': item.showInToolbar !== false ? 'dword:00000001' : 'dword:00000000'
    };

    return values;
  }

  /**
   * Escape arguments for registry format
   */
  private escapeArguments(args: string): string {
    return args
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/"/g, '\\\\"'); // Escape quotes
  }

  /**
   * Generate registry file content
   */
  generateRegistryFile(): string {
    const entries = this.generateRegistryEntries();
    let content = 'REGEDIT4\n\n';

    for (const entry of entries) {
      content += `${entry.key}\n`;
      
      for (const [key, value] of Object.entries(entry.values)) {
        content += `${key}=${value}\n`;
      }
      
      content += '\n';
    }

    return content;
  }

  /**
   * Save registry file to disk
   */
  saveRegistryFile(outputPath: string): void {
    const content = this.generateRegistryFile();
    
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, content, 'utf8');
  }

  /**
   * Load menu configuration from JSON file
   */
  static loadFromJson(jsonPath: string): SalamanderMenuConfig {
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON configuration file not found: ${jsonPath}`);
    }

    const content = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(content) as SalamanderMenuConfig;
  }

  /**
   * Find insertion point in existing registry
   */
  static findInsertionPoint(registryPath: string, groupName?: string): number {
    if (!fs.existsSync(registryPath)) {
      return 1; // Start at index 1 if no existing registry
    }

    const maxIndex = this.parseExistingRegistry(registryPath);
    
    if (!groupName) {
      return maxIndex + 1;
    }

    // Find group and insert before submenu end
    const content = fs.readFileSync(registryPath, 'utf8');
    const lines = content.split('\n');
    
    let inTargetGroup = false;
    let groupStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for menu entry
      const menuMatch = line.match(/\\User Menu\\(\d+)\]/);
      if (menuMatch) {
        const index = parseInt(menuMatch[1], 10);
        
        // Look for item name in next few lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nameLine = lines[j];
          if (nameLine.includes('"Item Name"')) {
            const nameMatch = nameLine.match(/"Item Name"="([^"]+)"/);
            if (nameMatch) {
              const itemName = nameMatch[1];
              
              if (itemName === groupName) {
                inTargetGroup = true;
                groupStartIndex = index;
              } else if (itemName === '(Submenu End)' && inTargetGroup) {
                return index; // Insert before submenu end
              }
            }
            break;
          }
        }
      }
    }
    
    return maxIndex + 1; // Fallback to end
  }
}

/**
 * Windows Registry helper for direct registry operations using regedit package
 */
export class WindowsRegistry {
  private static isWindows(): boolean {
    return process.platform === 'win32' && promisified !== null;
  }

  private static ensureRegedit(): void {
    if (!this.isWindows()) {
      throw new Error('Registry operations are only supported on Windows with regedit package installed');
    }
  }

  /**
   * Read all User Menu entries from registry
   */
  static async readUserMenuEntries(baseKey: string = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu'): Promise<Record<string, any>> {
    this.ensureRegedit();

    try {
      const result = await promisified.list([baseKey]);
      return result[baseKey] || { exists: false, keys: [], values: {} };
    } catch (error) {
      return { exists: false, keys: [], values: {} };
    }
  }

  /**
   * Read specific menu entry by index
   */
  static async readMenuEntry(index: number, baseKey: string = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu'): Promise<Record<string, any>> {
    this.ensureRegedit();

    const keyPath = `${baseKey}\\${index}`;
    try {
      const result = await promisified.list([keyPath]);
      return result[keyPath] || { exists: false, keys: [], values: {} };
    } catch (error) {
      return { exists: false, keys: [], values: {} };
    }
  }

  /**
   * Get all existing menu indices
   */
  static async getExistingMenuIndices(baseKey: string = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu'): Promise<number[]> {
    this.ensureRegedit();

    const menuData = await this.readUserMenuEntries(baseKey);
    if (!menuData.exists) {
      return [];
    }

    return menuData.keys
      .map((key: string) => parseInt(key, 10))
      .filter((index: number) => !isNaN(index))
      .sort((a: number, b: number) => a - b);
  }

  /**
   * Get next available menu index
   */
  static async getNextMenuIndex(baseKey: string = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu'): Promise<number> {
    const indices = await this.getExistingMenuIndices(baseKey);
    return indices.length > 0 ? Math.max(...indices) + 1 : 1;
  }

  /**
   * Find insertion point for a specific group
   */
  static async findGroupInsertionPoint(groupName: string, baseKey: string = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu'): Promise<number> {
    this.ensureRegedit();

    const indices = await this.getExistingMenuIndices(baseKey);
    
    let inTargetGroup = false;
    
    for (const index of indices) {
      const entry = await this.readMenuEntry(index, baseKey);
      
      if (entry.exists && entry.values['Item Name']) {
        const itemName = entry.values['Item Name'].value;
        
        if (itemName === groupName) {
          inTargetGroup = true;
        } else if (itemName === '(Submenu End)' && inTargetGroup) {
          return index; // Insert before submenu end
        }
      }
    }
    
    return await this.getNextMenuIndex(baseKey); // Fallback to end
  }

  /**
   * Write registry values for a menu entry
   */
  static async writeMenuEntry(index: number, values: Record<string, any>, baseKey: string = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu'): Promise<void> {
    this.ensureRegedit();

    const keyPath = `${baseKey}\\${index}`;
    
    // First create the key
    await promisified.createKey([keyPath]);
    
    // Then write the values
    const valuesToWrite: Record<string, any> = {};
    valuesToWrite[keyPath] = {};
    
    for (const [valueName, valueData] of Object.entries(values)) {
      const cleanValueName = valueName.replace(/"/g, '');
      let cleanValueData = String(valueData);
      let valueType = 'REG_SZ';
      
      if (cleanValueData.startsWith('dword:')) {
        valueType = 'REG_DWORD';
        cleanValueData = parseInt(cleanValueData.replace('dword:', ''), 16).toString();
      } else {
        // Only strip quotes for non-Arguments fields to preserve command-line quoting
        if (cleanValueName !== 'Arguments') {
          cleanValueData = cleanValueData.replace(/"/g, '');
        }
      }
      
      valuesToWrite[keyPath][cleanValueName] = {
        value: cleanValueData,
        type: valueType
      };
    }
    
    await promisified.putValue(valuesToWrite);
  }

  /**
   * Delete a menu entry
   */
  static async deleteMenuEntry(index: number, baseKey: string = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu'): Promise<void> {
    this.ensureRegedit();

    const keyPath = `${baseKey}\\${index}`;
    
    try {
      await promisified.deleteKey([keyPath]);
    } catch (error) {
      // Key might not exist, ignore error
    }
  }

  /**
   * List all menu entries with their details
   */
  static async listAllMenuEntries(baseKey: string = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu'): Promise<Array<{index: number, name: string, type: string, command?: string, arguments?: string}>> {
    const indices = await this.getExistingMenuIndices(baseKey);
    const entries = [];
    
    for (const index of indices) {
      const entry = await this.readMenuEntry(index, baseKey);
      
      if (entry.exists && entry.values['Item Name']) {
        const name = entry.values['Item Name'].value;
        const type = entry.values['Type'] ? entry.values['Type'].value : 0;
        const command = entry.values['Command'] ? entry.values['Command'].value : '';
        const args = entry.values['Arguments'] ? entry.values['Arguments'].value : '';
        
        let typeString = 'command';
        if (type === 1 || type === '0x00000001') typeString = 'submenu';
        if (type === 2 || type === '0x00000002') typeString = 'submenu-end';
        
        entries.push({
          index,
          name,
          type: typeString,
          command: command || undefined,
          arguments: args || undefined
        });
      }
    }
    
    return entries;
  }
}

/**
 * Extended Salamander Menu Generator with direct registry support
 */
export class SalamanderMenuGeneratorRegistry extends SalamanderMenuGenerator {
  
  /**
   * Apply menu configuration directly to Windows registry
   */
  async applyToRegistry(): Promise<void> {
    if (process.platform !== 'win32') {
      throw new Error('Direct registry operations are only supported on Windows');
    }

    const entries = this.generateRegistryEntries();
    
    for (const entry of entries) {
      // Extract menu index from key
      const keyMatch = entry.key.match(/\\User Menu\\(\d+)\]/);
      if (!keyMatch) continue;
      
      const menuIndex = parseInt(keyMatch[1], 10);
      
      await WindowsRegistry.writeMenuEntry(menuIndex, entry.values);
    }
  }

  /**
   * Remove menu entries from Windows registry
   */
  async removeFromRegistry(): Promise<void> {
    if (process.platform !== 'win32') {
      throw new Error('Direct registry operations are only supported on Windows');
    }

    const entries = this.generateRegistryEntries();
    
    // Remove in reverse order to avoid index issues
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      const keyMatch = entry.key.match(/\\User Menu\\(\d+)\]/);
      if (keyMatch) {
        const menuIndex = parseInt(keyMatch[1], 10);
        await WindowsRegistry.deleteMenuEntry(menuIndex);
      }
    }
  }

  /**
   * Auto-detect insertion point from Windows registry
   */
  static async autoDetectInsertionPoint(groupName?: string): Promise<number> {
    if (process.platform !== 'win32') {
      throw new Error('Registry operations are only supported on Windows');
    }

    if (groupName) {
      return await WindowsRegistry.findGroupInsertionPoint(groupName);
    } else {
      return await WindowsRegistry.getNextMenuIndex();
    }
  }

  /**
   * List current menu entries from registry
   */
  static async listCurrentMenuEntries(): Promise<Array<{index: number, name: string, type: string, command?: string, arguments?: string}>> {
    return await WindowsRegistry.listAllMenuEntries();
  }
}

export default SalamanderMenuGenerator;
