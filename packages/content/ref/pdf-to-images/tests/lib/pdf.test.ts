// Test suite for src/lib/pdf.ts
import { describe, it, expect, vi, beforeEach, Mock, beforeAll } from 'vitest';
import { convertPdfToImages, PdfToImageOptions } from '../../src/lib/pdf';
import { Logger } from 'tslog';
import { Buffer } from 'node:buffer';

// --- Define Mock Functions FIRST --- 
const mockWriteFile = vi.fn();
const mockAsPNG = vi.fn();
const mockAsJPEG = vi.fn();
const mockToPixmap = vi.fn();
const mockLoadPage = vi.fn();
const mockCountPages = vi.fn();
const mockOpenDocument = vi.fn();
const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();

// Use beforeAll to ensure mocks are set before tests run
beforeAll(() => {
  // Use vi.doMock for non-hoisted mocking
  vi.doMock('node:fs/promises', () => ({
    writeFile: mockWriteFile,
  }));
  vi.doMock('mupdf', () => ({
    Document: {
      openDocument: mockOpenDocument,
    },
    ColorSpace: {
      DeviceRGB: 'DeviceRGB' 
    }
  }));
  vi.doMock('tslog', () => ({
    Logger: vi.fn().mockImplementation(() => ({
      info: mockLoggerInfo,
      error: mockLoggerError,
    })),
  }));
});

// --- Dynamic Import and Test Execution --- 
async function runTests() {
  // Dynamically import the module *after* mocks are set up
  const { convertPdfToImages } = await import('../../src/lib/pdf');

  describe('convertPdfToImages Function', () => {
    let convertPdfToImages: typeof import('../../src/lib/pdf').convertPdfToImages;

    // Import the actual function *after* mocks are applied
    beforeAll(async () => {
      // Ensure mocks are ready before importing the module that uses them
      await vi.dynamicImportSettled();
      const pdfLib = await import('../../src/lib/pdf');
      convertPdfToImages = pdfLib.convertPdfToImages;
    });

    const mockPdfData = Buffer.from('mock-pdf-data');
    const baseOptions: Omit<PdfToImageOptions, 'outputPathPrefix'> = {
      dpi: 300,
      format: 'png',
    };
    
    // Mocks returned by other mocks need to be configured within beforeEach
    const mockPixmap = { asPNG: mockAsPNG, asJPEG: mockAsJPEG };
    const mockPage = { toPixmap: mockToPixmap };
    const mockDoc = { countPages: mockCountPages, loadPage: mockLoadPage };

    beforeEach(() => {
      vi.clearAllMocks();
      
      // Configure mock implementations/return values
      mockWriteFile.mockResolvedValue(undefined); 
      mockAsPNG.mockReturnValue(Buffer.from('mock-png-data'));
      mockAsJPEG.mockReturnValue(Buffer.from('mock-jpg-data'));
      mockToPixmap.mockReturnValue(mockPixmap);
      mockLoadPage.mockReturnValue(mockPage);
      mockCountPages.mockReturnValue(5);
      mockOpenDocument.mockReturnValue(mockDoc);
    });

    it('should convert all pages to PNG by default', async () => {
      const options: PdfToImageOptions = { ...baseOptions, outputPathPrefix: 'output/image' };
      const result = await convertPdfToImages(mockPdfData, options);

      expect(mockOpenDocument).toHaveBeenCalledWith(mockPdfData, 'pdf');
      expect(mockCountPages).toHaveBeenCalled();
      expect(mockLoadPage).toHaveBeenCalledTimes(5);
      expect(mockToPixmap).toHaveBeenCalledTimes(5);
      expect(mockAsPNG).toHaveBeenCalledTimes(5);
      expect(mockAsJPEG).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledTimes(5);
      expect(mockWriteFile).toHaveBeenNthCalledWith(1, 'output/image_1.png', Buffer.from('mock-png-data'));
      expect(mockWriteFile).toHaveBeenNthCalledWith(5, 'output/image_5.png', Buffer.from('mock-png-data'));
      expect(result).toEqual([
        'output/image_1.png',
        'output/image_2.png',
        'output/image_3.png',
        'output/image_4.png',
        'output/image_5.png',
      ]);
    });

    it('should convert specified page range to JPG', async () => {
      const options: PdfToImageOptions = {
        ...baseOptions,
        outputPathPrefix: 'jpg_images/page',
        format: 'jpg',
        startPage: 2,
        endPage: 4,
      };
      const result = await convertPdfToImages(mockPdfData, options);

      expect(mockLoadPage).toHaveBeenCalledTimes(3); // Pages 2, 3, 4
      expect(mockLoadPage).toHaveBeenNthCalledWith(1, 1); // 0-based index for page 2
      expect(mockLoadPage).toHaveBeenNthCalledWith(3, 3); // 0-based index for page 4
      expect(mockToPixmap).toHaveBeenCalledTimes(3);
      expect(mockAsJPEG).toHaveBeenCalledTimes(3);
      expect(mockAsPNG).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledTimes(3);
      expect(mockWriteFile).toHaveBeenNthCalledWith(1, 'jpg_images/page_2.jpg', Buffer.from('mock-jpg-data'));
      expect(mockWriteFile).toHaveBeenNthCalledWith(3, 'jpg_images/page_4.jpg', Buffer.from('mock-jpg-data'));
      expect(result).toEqual([
        'jpg_images/page_2.jpg',
        'jpg_images/page_3.jpg',
        'jpg_images/page_4.jpg',
      ]);
    });

    it('should throw error for invalid startPage', async () => {
      const options: PdfToImageOptions = { ...baseOptions, outputPathPrefix: 'err', startPage: 0 };
      await expect(convertPdfToImages(mockPdfData, options))
        .rejects.toThrow('startPage (0) is out of valid range (1-5)');
    });

    it('should throw error for invalid endPage', async () => {
      mockCountPages.mockReturnValue(3); // Adjust page count for this test
      const options: PdfToImageOptions = { ...baseOptions, outputPathPrefix: 'err', endPage: 4 };
      await expect(convertPdfToImages(mockPdfData, options))
        .rejects.toThrow('endPage (4) is out of valid range (1-3)');
    });

    it('should throw error if startPage > endPage', async () => {
      const options: PdfToImageOptions = { ...baseOptions, outputPathPrefix: 'err', startPage: 4, endPage: 2 };
      await expect(convertPdfToImages(mockPdfData, options))
        .rejects.toThrow('startPage (4) cannot be greater than endPage (2)');
    });

    it('should propagate errors from mupdf loadPage', async () => {
      const mupdfError = new Error('mupdf loadPage failed');
      mockLoadPage.mockImplementation(() => { 
        throw mupdfError; 
      });
      const options: PdfToImageOptions = { ...baseOptions, outputPathPrefix: 'mupdf_err' };
      await expect(convertPdfToImages(mockPdfData, options))
        .rejects.toThrow('mupdf loadPage failed');
    });

    it('should propagate errors from writeFile', async () => {
      const fsError = new Error('fs failed');
      mockWriteFile.mockImplementation(async () => { 
        throw fsError; 
      });
      const options: PdfToImageOptions = { ...baseOptions, outputPathPrefix: 'fs_err' };
      await expect(convertPdfToImages(mockPdfData, options))
        .rejects.toThrow('fs failed');
    });

    it('should use provided logger', async () => {
      const customLogger = { info: vi.fn(), error: vi.fn() };
      const options: PdfToImageOptions = { 
          ...baseOptions, 
          outputPathPrefix: 'log_test', 
          logger: customLogger as any 
      };
      await convertPdfToImages(mockPdfData, options);
      expect(customLogger.info).toHaveBeenCalledWith(expect.stringContaining('Processing pages 1 to 5'));
      expect(customLogger.info).toHaveBeenCalledWith(expect.stringContaining('Converted page 1 to log_test_1.png'));
      expect(customLogger.info).toHaveBeenCalledTimes(6); 
      expect(mockLoggerInfo).not.toHaveBeenCalled(); // Ensure default mock logger wasn't used
    });
  });
}

// Run the tests
runTests();

// Need to alias the mock for use within the test file scope
import * as fsPromises from 'node:fs/promises';
import * as mupdf from 'mupdf'; 