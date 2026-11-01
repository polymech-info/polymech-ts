import * as fs from 'fs';
import * as path from 'path';
import regedit from 'regedit';
const promisified = regedit.promisified;
export class SalamanderMenuGenerator {
    config;
    baseKey = 'HKEY_CURRENT_USER\\Software\\Altap\\Altap Salamander 4.0\\User Menu';
    constructor(config) {
        this.config = config;
        if (config.baseKey) {
            this.baseKey = config.baseKey;
        }
    }
    /**
     * Parse existing registry file to find the highest menu index
     */
    static parseExistingRegistry(registryPath) {
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
    generateRegistryEntries() {
        const entries = [];
        let currentIndex = this.config.startIndex;
        const processItems = (items, isSubMenu = false) => {
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
                }
                else {
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
    itemToRegistryValues(item, type) {
        const values = {
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
    escapeArguments(args) {
        return args
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(/"/g, '\\\\"'); // Escape quotes
    }
    /**
     * Generate registry file content
     */
    generateRegistryFile() {
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
    saveRegistryFile(outputPath) {
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
    static loadFromJson(jsonPath) {
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`JSON configuration file not found: ${jsonPath}`);
        }
        const content = fs.readFileSync(jsonPath, 'utf8');
        return JSON.parse(content);
    }
    /**
     * Find insertion point in existing registry
     */
    static findInsertionPoint(registryPath, groupName) {
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
                            }
                            else if (itemName === '(Submenu End)' && inTargetGroup) {
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
    static isWindows() {
        return process.platform === 'win32' && promisified !== null;
    }
    static ensureRegedit() {
        if (!this.isWindows()) {
            throw new Error('Registry operations are only supported on Windows with regedit package installed');
        }
    }
    /**
     * Read all User Menu entries from registry
     */
    static async readUserMenuEntries(baseKey = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu') {
        this.ensureRegedit();
        try {
            const result = await promisified.list([baseKey]);
            return result[baseKey] || { exists: false, keys: [], values: {} };
        }
        catch (error) {
            return { exists: false, keys: [], values: {} };
        }
    }
    /**
     * Read specific menu entry by index
     */
    static async readMenuEntry(index, baseKey = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu') {
        this.ensureRegedit();
        const keyPath = `${baseKey}\\${index}`;
        try {
            const result = await promisified.list([keyPath]);
            return result[keyPath] || { exists: false, keys: [], values: {} };
        }
        catch (error) {
            return { exists: false, keys: [], values: {} };
        }
    }
    /**
     * Get all existing menu indices
     */
    static async getExistingMenuIndices(baseKey = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu') {
        this.ensureRegedit();
        const menuData = await this.readUserMenuEntries(baseKey);
        if (!menuData.exists) {
            return [];
        }
        return menuData.keys
            .map((key) => parseInt(key, 10))
            .filter((index) => !isNaN(index))
            .sort((a, b) => a - b);
    }
    /**
     * Get next available menu index
     */
    static async getNextMenuIndex(baseKey = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu') {
        const indices = await this.getExistingMenuIndices(baseKey);
        return indices.length > 0 ? Math.max(...indices) + 1 : 1;
    }
    /**
     * Find insertion point for a specific group
     */
    static async findGroupInsertionPoint(groupName, baseKey = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu') {
        this.ensureRegedit();
        const indices = await this.getExistingMenuIndices(baseKey);
        let inTargetGroup = false;
        for (const index of indices) {
            const entry = await this.readMenuEntry(index, baseKey);
            if (entry.exists && entry.values['Item Name']) {
                const itemName = entry.values['Item Name'].value;
                if (itemName === groupName) {
                    inTargetGroup = true;
                }
                else if (itemName === '(Submenu End)' && inTargetGroup) {
                    return index; // Insert before submenu end
                }
            }
        }
        return await this.getNextMenuIndex(baseKey); // Fallback to end
    }
    /**
     * Write registry values for a menu entry
     */
    static async writeMenuEntry(index, values, baseKey = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu') {
        this.ensureRegedit();
        const keyPath = `${baseKey}\\${index}`;
        // First create the key
        await promisified.createKey([keyPath]);
        // Then write the values
        const valuesToWrite = {};
        valuesToWrite[keyPath] = {};
        for (const [valueName, valueData] of Object.entries(values)) {
            const cleanValueName = valueName.replace(/"/g, '');
            let cleanValueData = String(valueData);
            let valueType = 'REG_SZ';
            if (cleanValueData.startsWith('dword:')) {
                valueType = 'REG_DWORD';
                cleanValueData = parseInt(cleanValueData.replace('dword:', ''), 16).toString();
            }
            else {
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
    static async deleteMenuEntry(index, baseKey = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu') {
        this.ensureRegedit();
        const keyPath = `${baseKey}\\${index}`;
        try {
            await promisified.deleteKey([keyPath]);
        }
        catch (error) {
            // Key might not exist, ignore error
        }
    }
    /**
     * List all menu entries with their details
     */
    static async listAllMenuEntries(baseKey = 'HKCU\\Software\\Altap\\Altap Salamander 4.0\\User Menu') {
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
                if (type === 1 || type === '0x00000001')
                    typeString = 'submenu';
                if (type === 2 || type === '0x00000002')
                    typeString = 'submenu-end';
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
    async applyToRegistry() {
        if (process.platform !== 'win32') {
            throw new Error('Direct registry operations are only supported on Windows');
        }
        const entries = this.generateRegistryEntries();
        for (const entry of entries) {
            // Extract menu index from key
            const keyMatch = entry.key.match(/\\User Menu\\(\d+)\]/);
            if (!keyMatch)
                continue;
            const menuIndex = parseInt(keyMatch[1], 10);
            await WindowsRegistry.writeMenuEntry(menuIndex, entry.values);
        }
    }
    /**
     * Remove menu entries from Windows registry
     */
    async removeFromRegistry() {
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
    static async autoDetectInsertionPoint(groupName) {
        if (process.platform !== 'win32') {
            throw new Error('Registry operations are only supported on Windows');
        }
        if (groupName) {
            return await WindowsRegistry.findGroupInsertionPoint(groupName);
        }
        else {
            return await WindowsRegistry.getNextMenuIndex();
        }
    }
    /**
     * List current menu entries from registry
     */
    static async listCurrentMenuEntries() {
        return await WindowsRegistry.listAllMenuEntries();
    }
}
export default SalamanderMenuGenerator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3NhbGFtYW5kZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBRTlCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7QUEyQnhDLE1BQU0sT0FBTyx1QkFBdUI7SUFHZDtJQUZaLE9BQU8sR0FBVyxxRUFBcUUsQ0FBQztJQUVoRyxZQUFvQixNQUE0QjtRQUE1QixXQUFNLEdBQU4sTUFBTSxDQUFzQjtRQUM5QyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDaEMsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxZQUFvQjtRQUMvQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE9BQU8sQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3RELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBRWpCLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7WUFDekIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ2pELElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxLQUFLLEdBQUcsUUFB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