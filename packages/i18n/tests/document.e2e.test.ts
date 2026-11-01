import { describe, it, expect } from 'vitest'
import * as cp from 'child_process'
import * as util from 'util'
import * as path from 'path'
import * as fs from 'fs'

const exec = util.promisify(cp.exec)
// Get CLI path explicitly starting from cwd since vitest __dirname can be tricky depending on config
const CLI_PATH = path.resolve(process.cwd(), 'dist/main.js')

describe('DeepL Document API Translation (Live)', () => {

    it('should translate test.pdf natively as a document', async () => {
        const srcPath = path.resolve(process.cwd(), 'tests/documents/test.pdf');
        const dstPath = path.resolve(process.cwd(), 'tests/documents/test_de.pdf');
        
        // Assert the test file exists before running
        expect(fs.existsSync(srcPath)).toBe(true);

        // Clean up any old output file
        if (fs.existsSync(dstPath)) {
            fs.unlinkSync(dstPath);
        }

        const { stdout, stderr } = await exec(`node ${CLI_PATH} translate --src="${srcPath}" --srcLang="en" --dstLang="de"`);
        
        console.log(stdout, stderr);
        // We verify the translation loop succeeds without errors.
        expect(stderr).not.toMatch(/error/i);

        // Verify that the output document got downloaded correctly
        expect(fs.existsSync(dstPath)).toBe(true);
        expect(fs.statSync(dstPath).size).toBeGreaterThan(0);
    }, 120000); // 120s timeout for real API call

    it('should translate test.xlsx as a document specifically requesting engine=document', async () => {
        const srcPath = path.resolve(process.cwd(), 'tests/documents/test.xlsx');
        const dstPath = path.resolve(process.cwd(), 'tests/documents/test_de.xlsx');
        
        // Assert the test file exists before running
        expect(fs.existsSync(srcPath)).toBe(true);

        // Clean up any old output file
        if (fs.existsSync(dstPath)) {
            fs.unlinkSync(dstPath);
        }

        const { stdout, stderr } = await exec(`node ${CLI_PATH} translate --src="${srcPath}" --srcLang="en" --dstLang="de" --engine="document"`);
        
        console.log(stdout, stderr);
        // We verify the translation loop succeeds without errors.
        expect(stderr).not.toMatch(/error/i);

        // Verify that the output document got downloaded correctly
        expect(fs.existsSync(dstPath)).toBe(true);
        expect(fs.statSync(dstPath).size).toBeGreaterThan(0);
    }, 120000); // 120s timeout for real API call

    it('should translate test.md specifically requesting engine=markdown', async () => {
        const srcPath = path.resolve(process.cwd(), 'tests/documents/test.md');
        const dstPath = path.resolve(process.cwd(), 'tests/documents/test_de.md');
        
        // Assert the test file exists before running
        expect(fs.existsSync(srcPath)).toBe(true);

        // Clean up any old output file
        if (fs.existsSync(dstPath)) {
            fs.unlinkSync(dstPath);
        }

        const { stdout, stderr } = await exec(`node ${CLI_PATH} translate --src="${srcPath}" --srcLang="en" --dstLang="de" --engine="markdown"`);
        
        console.log(stdout, stderr);
        // We verify the translation loop succeeds without errors.
        expect(stderr).not.toMatch(/error/i);

        // Verify that the output document got generated correctly
        expect(fs.existsSync(dstPath)).toBe(true);
        
        // Let's also ensure the file size is sane
        const size = fs.statSync(dstPath).size;
        expect(size).toBeGreaterThan(0);
        
        // Check for encoding corruption (should not have UTF-16 BOM or gibberish)
        const translatedContent = fs.readFileSync(dstPath, 'utf-8');
        expect(translatedContent).not.toMatch(/ï¿½/);
    }, 120000); // 120s timeout for real API call
})
