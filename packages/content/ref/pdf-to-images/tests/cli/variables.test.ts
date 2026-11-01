import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, rmSync, readdirSync } from 'node:fs';
import * as path from 'node:path';

const packageRoot = process.cwd(); // Assumes test runs from package root
const inputPdf = path.join('tests', 'RS485-780.pdf');
const outputDir = path.join(packageRoot, 'tests', 'out', 'RS485-780');
const outputPattern = '${SRC_DIR}/out/${SRC_NAME}/${SRC_NAME}-${PAGE}.jpg';

// Expected number of pages for RS485-780.pdf
const expectedPageCount = 29; 
const expectedBaseName = 'RS485-780';
const expectedFormat = 'jpg'; // Default format

describe('CLI Integration Test - Variable Output Path', () => {
  beforeAll(() => {
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (existsSync(outputDir)) {
      // rmSync(outputDir, { recursive: true, force: true }); // Optional: clean up after tests
    }
  });

  it('should create images in the correct directory with the correct filenames using variable substitution', () => {
    // Construct the command
    // Ensure paths in the command are relative to the execution directory if needed,
    // but here inputPdf is relative, and outputPattern relies on internal resolution.
    // Quote the output pattern for safety in the shell.
    const command = `node dist/index.js convert --input "${inputPdf}" --output "${outputPattern}"`;

    // Execute the command
    let commandOutput = '';
    try {
      // Use { stdio: 'pipe' } to potentially suppress noisy output or capture errors
      commandOutput = execSync(command, { encoding: 'utf8', stdio: 'pipe' }); 
      console.log('Command execution output:', commandOutput); 
    } catch (error: any) {
      // If the command fails, log the error and fail the test
      console.error('Command execution failed:', error.stderr || error.stdout || error.message);
      expect.fail(`Command execution failed: ${error.message}`);
    }

    // 1. Check if the output directory exists
    expect(existsSync(outputDir), `Output directory "${outputDir}" should exist`).toBe(true);

    // 2. Check the number of files created
    const files = readdirSync(outputDir);
    expect(files.length, `Should have created ${expectedPageCount} files`).toBe(expectedPageCount);

    // 3. Check filenames
    for (let i = 1; i <= expectedPageCount; i++) {
      const expectedFilename = `${expectedBaseName}-${i}.${expectedFormat}`;
      expect(files, `File list should include "${expectedFilename}"`).toContain(expectedFilename);
    }
  });
}); 