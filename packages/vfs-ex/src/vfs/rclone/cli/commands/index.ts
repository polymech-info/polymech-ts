import type { Argv } from 'yargs';
import { setupCoreCommands } from './core';
import { setupFileCommands } from './file';
import { setupConfigCommands } from './config';
import { setupSyncCommands } from './sync';
import { setupServerCommands } from './server';
import { setupDebugCommands } from './debug';
import { setupLibCommands } from './lib';

export function setupCommands(yargs: Argv): void {
  // Library-based high-level commands
  setupLibCommands(yargs);
  
  // Core commands (ls, lsd, lsf, etc.)
  setupCoreCommands(yargs);
  
  // File operations (copy, move, delete, etc.)
  setupFileCommands(yargs);
  
  // Sync operations (sync, bisync, etc.)
  setupSyncCommands(yargs);
  
  // Configuration commands
  setupConfigCommands(yargs);
  
  // Server commands (serve, mount, etc.)
  setupServerCommands(yargs);
  
  // Debug and utility commands
  setupDebugCommands(yargs);
}

