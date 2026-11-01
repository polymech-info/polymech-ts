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
export declare class SalamanderMenuGenerator {
    private config;
    private baseKey;
    constructor(config: SalamanderMenuConfig);
    /**
     * Parse existing registry file to find the highest menu index
     */
    static parseExistingRegistry(registryPath: string): number;
    /**
     * Generate registry entries from menu configuration
     */
    generateRegistryEntries(): RegistryEntry[];
    /**
     * Convert menu item to registry values
     */
    private itemToRegistryValues;
    /**
     * Escape arguments for registry format
     */
    private escapeArguments;
    /**
     * Generate registry file content
     */
    generateRegistryFile(): string;
    /**
     * Save registry file to disk
     */
    saveRegistryFile(outputPath: string): void;
    /**
     * Load menu configuration from JSON file
     */
    static loadFromJson(jsonPath: string): SalamanderMenuConfig;
    /**
     * Find insertion point in existing registry
     */
    static findInsertionPoint(registryPath: string, groupName?: string): number;
}
/**
 * Windows Registry helper for direct registry operations using regedit package
 */
export declare class WindowsRegistry {
    private static isWindows;
    private static ensureRegedit;
    /**
     * Read all User Menu entries from registry
     */
    static readUserMenuEntries(baseKey?: string): Promise<Record<string, any>>;
    /**
     * Read specific menu entry by index
     */
    static readMenuEntry(index: number, baseKey?: string): Promise<Record<string, any>>;
    /**
     * Get all existing menu indices
     */
    static getExistingMenuIndices(baseKey?: string): Promise<number[]>;
    /**
     * Get next available menu index
     */
    static getNextMenuIndex(baseKey?: string): Promise<number>;
    /**
     * Find insertion point for a specific group
     */
    static findGroupInsertionPoint(groupName: string, baseKey?: string): Promise<number>;
    /**
     * Write registry values for a menu entry
     */
    static writeMenuEntry(index: number, values: Record<string, any>, baseKey?: string): Promise<void>;
    /**
     * Delete a menu entry
     */
    static deleteMenuEntry(index: number, baseKey?: string): Promise<void>;
    /**
     * List all menu entries with their details
     */
    static listAllMenuEntries(baseKey?: string): Promise<Array<{
        index: number;
        name: string;
        type: string;
        command?: string;
        arguments?: string;
    }>>;
}
/**
 * Extended Salamander Menu Generator with direct registry support
 */
export declare class SalamanderMenuGeneratorRegistry extends SalamanderMenuGenerator {
    /**
     * Apply menu configuration directly to Windows registry
     */
    applyToRegistry(): Promise<void>;
    /**
     * Remove menu entries from Windows registry
     */
    removeFromRegistry(): Promise<void>;
    /**
     * Auto-detect insertion point from Windows registry
     */
    static autoDetectInsertionPoint(groupName?: string): Promise<number>;
    /**
     * List current menu entries from registry
     */
    static listCurrentMenuEntries(): Promise<Array<{
        index: number;
        name: string;
        type: string;
        command?: string;
        arguments?: string;
    }>>;
}
export default SalamanderMenuGenerator;
