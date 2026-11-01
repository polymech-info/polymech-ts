// Test suite for src/commands/convert.ts
import { describe, it, expect, vi, beforeEach, Mock, beforeAll } from 'vitest';
// Import types first
import type { ConvertCommandConfig } from '../../src/types.js';
import type { Arguments } from 'yargs';
// Remove Buffer import if readFile is no longer mocked directly
// import { Buffer } from 'node:buffer'; 
// Import path for constants only if needed, remove specific utils
import path from 'path'; 

// --- Define Mock Functions --- 
// Keep only mocks needed for the simplified handler
const mockRunConversion = vi.fn(); // Mock the library function
const mockExistsSync = vi.fn();
const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

// Remove mocks for functions no longer directly called by handler
// const mockConvertPdfToImagesFn = vi.fn();
// const mockStatSync = vi.fn(); 
// const mockReadFile = vi.fn();
// const mockMkdir = vi.fn();
// const mockDirname = vi.fn();
// const mockBasename = vi.fn();
// const mockExtname = vi.fn();
// const mockResolve = vi.fn(); 
// const mockParse = vi.fn(); 
// const mockRelative = vi.fn(); 
// const mockResolveVariables = vi.fn();
// const mockPathInfoEx = vi.fn();
// const mockDEFAULT_ROOTS = { CWD: '/test/cwd', SCRIPT_DIR: '/test/script' };
// const mockDEFAULT_VARS = vi.fn().mockReturnValue({ SOME_DEFAULT: 'value' });

// Use beforeAll for mocks
beforeAll(() => {
  // Mock dependencies using vi.doMock
  // Remove unused mocks
  // vi.doMock('../../src/lib/pdf.js', ...)
  vi.doMock('../../src/lib/convert.js', () => ({
    runConversion: mockRunConversion, // Mock the refactored library function
  }));
  vi.doMock('node:fs', () => ({
      existsSync: mockExistsSync,
      // statSync: mockStatSync, 
  }));
  // vi.doMock('node:fs/promises', ...)
  // vi.doMock('node:path', ...)
  vi.doMock('tslog', () => ({
      Logger: vi.fn().mockImplementation(() => ({
          info: mockLoggerInfo,
          error: mockLoggerError,
      })),
  }));
  // vi.doMock('@polymech/commons', ...)
});

// --- Test Suite --- 
describe('Convert Command CLI Handler', () => {
  let convertHandler: typeof import('../../src/commands/convert.js').handler;

  // Import the handler after mocks are set
  beforeAll(async () => {
    await vi.dynamicImportSettled(); // Ensure mocks are applied
    const commandModule = await import('../../src/commands/convert.js');
    convertHandler = commandModule.handler;
  });

  // --- Helper Function to Run Handler --- 
  // Helper remains largely the same
  async function runHandlerHelper(args: Partial<ConvertCommandConfig & { _: (string | number)[], $0: string, output?: string }>) {
      // Add default values for required fields if not provided in args, 
      // reflecting what yargs + schema default would do.
      const fullArgs = {
          _: ['convert'],
          $0: 'test',
          dpi: 300,       
          format: 'png',  
          ...args,
      } as Arguments<ConvertCommandConfig & {output?: string}>;
      
      // Need to simulate the full argv object including potential var-* args
      // Zod schema parsing happens inside the handler now.
      
      if (!convertHandler) throw new Error('Handler not loaded');
      await convertHandler(fullArgs);
  }

  beforeEach(() => {
      vi.clearAllMocks();
      // Reset only necessary mocks
      mockRunConversion.mockResolvedValue(['path/to/image1.png']); // Default success
      mockExistsSync.mockReturnValue(true);
      // Removed resets for unused mocks
      mockProcessExit.mockClear();
  });

  // --- Updated Test cases --- 
  it('should call runConversion with config when output is omitted (uses default)', async () => {
      const args = {
          input: 'pdfs/document.pdf',
          // output is omitted
      };
      
      await runHandlerHelper(args);

      expect(mockExistsSync).toHaveBeenCalledWith(args.input);
      expect(mockRunConversion).toHaveBeenCalledTimes(1);
      // Check the config object passed to runConversion
      expect(mockRunConversion).toHaveBeenCalledWith(
          expect.objectContaining({ 
              input: args.input,
              output: undefined, // Output should be undefined in the config passed from handler
              dpi: 300, // Default DPI
              format: 'png', // Default format
              // other args like startPage/endPage should be undefined
          }),
          expect.anything() // Logger instance
      );
      // Verify final success logs are called
      expect(mockLoggerInfo).toHaveBeenCalledWith('Conversion completed successfully');
      expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('Generated')); // Check for generated count message
      expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('should call runConversion with custom output path template when provided', async () => {
      const customPattern = 'images/custom_${SRC_NAME}_page${PAGE}.${FORMAT}';
      const args = {
          input: 'in.pdf',
          output: customPattern,
      };
      
      await runHandlerHelper(args);

      expect(mockExistsSync).toHaveBeenCalledWith(args.input);
      expect(mockRunConversion).toHaveBeenCalledTimes(1);
      expect(mockRunConversion).toHaveBeenCalledWith(
          expect.objectContaining({ 
              input: args.input,
              output: customPattern, // Expect the custom pattern string
          }),
          expect.anything() // Logger instance
      );
      expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('should call runConversion with output path when it is a directory', async () => {
      const dirPath = 'output/images/';
      const args = {
          input: 'some/path/doc.pdf',
          output: dirPath, 
      };

      await runHandlerHelper(args);

      expect(mockExistsSync).toHaveBeenCalledWith(args.input);
      expect(mockRunConversion).toHaveBeenCalledTimes(1);
      expect(mockRunConversion).toHaveBeenCalledWith(
          expect.objectContaining({ 
              input: args.input,
              output: dirPath, // Expect the directory path string
          }),
          expect.anything()
      );
      expect(mockProcessExit).not.toHaveBeenCalled();
  });

  // Test for specific args being passed through
  it('should call runConversion with specific args', async () => {
      const args = {
          input: 'input.pdf',
          output: 'output/prefix',
          dpi: 150,
          format: 'jpg' as const,
          startPage: 2,
          endPage: 5,
      };
      
      await runHandlerHelper(args);

      expect(mockExistsSync).toHaveBeenCalledWith(args.input);
      expect(mockRunConversion).toHaveBeenCalledTimes(1);
      expect(mockRunConversion).toHaveBeenCalledWith(
          expect.objectContaining({ 
              input: args.input,
              output: args.output,
              dpi: args.dpi,
              format: args.format,
              startPage: args.startPage,
              endPage: args.endPage,
          }),
          expect.anything()
      );
      expect(mockProcessExit).not.toHaveBeenCalled();
  });

  // Test for var-* args being passed through
  it('should pass var-* arguments to runConversion', async () => {
      const args = {
          input: 'input.pdf',
          'var-MY_VAR': 'myValue',
          'var-OTHER': 123
      };
      
      await runHandlerHelper(args);
      
      expect(mockRunConversion).toHaveBeenCalledTimes(1);
      expect(mockRunConversion).toHaveBeenCalledWith(
          expect.objectContaining({ 
              input: args.input,
              'var-MY_VAR': 'myValue', // Zod schema with catchall should preserve these
              'var-OTHER': 123,
          }),
          expect.anything()
      );
      expect(mockProcessExit).not.toHaveBeenCalled();
  });


  // --- Error Handling Tests --- 
  it('should handle missing input file', async () => {
      mockExistsSync.mockReturnValue(false);
      const args = { input: 'nonexistent.pdf' }; // Output is optional
      await runHandlerHelper(args);
      
      expect(mockRunConversion).not.toHaveBeenCalled(); // Should not be called
      // Check logger error message (updated)
      expect(mockLoggerError).toHaveBeenCalledWith(
          "Error during conversion command:", // Updated error context
          expect.stringContaining('Input file nonexistent.pdf does not exist'),
          expect.any(Error)
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should handle conversion error from runConversion', async () => {
      const conversionError = new Error('Conversion library failed');
      mockRunConversion.mockRejectedValue(conversionError); // Mock runConversion to throw
      const args = { input: 'in.pdf', output: 'out' };
      
      await runHandlerHelper(args);
      
      expect(mockRunConversion).toHaveBeenCalledTimes(1);
      // Check logger error message (updated)
      expect(mockLoggerError).toHaveBeenCalledWith(
          "Error during conversion command:", // Updated error context
          conversionError.message, 
          conversionError
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
  
  // Remove tests checking internal logic that was moved (e.g., mkdir calls)
}); 