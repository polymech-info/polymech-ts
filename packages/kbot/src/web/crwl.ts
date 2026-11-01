import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { promises as fs } from 'fs';

// Define the structure for the crawl4ai schema based on the documentation
// This provides type safety for the schema object
interface Crawl4aiField {
  name: string;
  selector: string;
  type: 'text' | 'attribute' | 'html' | 'regex' | string; // Allow string for other types
  attribute?: string; // Optional for 'attribute' type
  default?: any;      // Optional default value
  // TODO: Add support for nested schemas if required by your use case
}

interface Crawl4aiSchema {
  name: string;
  baseSelector: string;
  baseFields?: Crawl4aiField[]; // Optional base fields extracted from the container
  fields: Crawl4aiField[];
  // TODO: Add other schema properties like 'nested' if needed
}

// Base options interface with new config paths and flags
interface BaseCrawlOptions {
    outputMode: 'json' | 'markdown';
    pythonExecutable?: string;
    scriptPath?: string;
    browserConfigPath?: string;    // Path to browser config (JSON)
    crawlerConfigPath?: string;    // Path to crawler config (JSON)
    bypassCache?: boolean;         // Corresponds to --bypass-cache
    verbose?: boolean;             // Corresponds to -v, --verbose
    // --- Deep Crawl Options ---
    deepCrawlStrategy?: 'bfs' | 'dfs' | 'bestfirst';
    maxDepth?: number;             // Required if deepCrawlStrategy is set
    includeExternal?: boolean;     // Corresponds to --include-external
    maxPages?: number;             // Corresponds to --max-pages
    stream?: boolean;              // Corresponds to --stream
    // --- New Config Options ---
    headless?: boolean;            // Defaults to true (Python default), set false for --no-headless
    userAgent?: string;            // Corresponds to --user-agent
    textMode?: boolean;            // Corresponds to --text-mode
    lightMode?: boolean;           // Corresponds to --light-mode
    waitFor?: string;              // Corresponds to --wait-for
    screenshot?: boolean;          // Corresponds to --screenshot
    pdf?: boolean;                 // Corresponds to --pdf
    jsCode?: string;               // Corresponds to --js-code
    wordCountThreshold?: number;   // Corresponds to --word-count-threshold
}

// Options specific to JSON output mode (schema is now path)
interface JsonCrawlOptions extends BaseCrawlOptions {
    outputMode: 'json';
    schemaPath: string;            // Path to schema file (required for JSON mode)
    strategyType?: 'css' | 'xpath'; // Default to 'css' if not provided
}

// Options specific to Markdown output mode
interface MarkdownCrawlOptions extends BaseCrawlOptions {
    outputMode: 'markdown';
    schemaPath?: never;
    strategyType?: never;
}

// Combined type for the crawlAndExtract function options
export type CrawlOptions = JsonCrawlOptions | MarkdownCrawlOptions;

/**
 * Executes the crawl4ai Python script with extended options, using a temp file for output.
 * Assumes 'crawl4ai' is installed in the Python environment accessible by `pythonExecutable`.
 *
 * @param url The URL to crawl and extract data from.
 * @param options Configuration options including output mode, config paths, flags, etc.
 * @returns A promise that resolves with the extracted JSON data (parsed) or the generated Markdown string.
 * @throws An error if the Python script fails or returns an error message on stderr.
 */
export async function crawlAndExtract(url: string, options: CrawlOptions): Promise<any | string> {
  const {
    outputMode,
    pythonExecutable = 'python',
    scriptPath = path.resolve(__dirname, 'crwl_script.py'),
    browserConfigPath,
    crawlerConfigPath,
    bypassCache,
    verbose,
    // --- Destructure Deep Crawl Options ---
    deepCrawlStrategy,
    maxDepth,
    includeExternal,
    maxPages,
    stream,
    // --- Destructure New Config Options ---
    headless,
    userAgent,
    textMode,
    lightMode,
    waitFor,
    screenshot,
    pdf,
    jsCode,
    wordCountThreshold
  } = options;

  if (!url) {
    return Promise.reject(new Error('URL parameter is required.'));
  }

  const tempFileName = `crwl-${crypto.randomBytes(8).toString('hex')}.tmp`;
  const tempFilePath = path.join(os.tmpdir(), tempFileName);

  // Base arguments
  const args = [
    scriptPath,
    url,
    '--output-mode', outputMode,
    '--output-file', tempFilePath
  ];

  // Add JSON-specific options
  if (outputMode === 'json') {
    if (!options.schemaPath) {
      // Ensure schemaPath is provided for JSON mode
      return Promise.reject(new Error('schemaPath is required for JSON output mode.'));
    }
    args.push('--schema', options.schemaPath);
    const strategyType = options.strategyType || 'css';
    args.push('--strategy-type', strategyType);
  }

  // Add optional config paths
  if (browserConfigPath) {
      args.push('--browser-config', browserConfigPath);
  }
  if (crawlerConfigPath) {
      args.push('--crawler-config', crawlerConfigPath);
  }

  // Add optional flags
  if (bypassCache) {
      args.push('--bypass-cache');
  }
  if (verbose) {
      args.push('--verbose');
  }

  // --- Add Deep Crawl Arguments ---
  if (deepCrawlStrategy) {
      if (maxDepth === undefined || maxDepth === null) {
          return Promise.reject(new Error('maxDepth is required when deepCrawlStrategy is specified.'));
      }
      args.push('--deep-crawl-strategy', deepCrawlStrategy);
      args.push('--max-depth', String(maxDepth));
      if (includeExternal) {
          args.push('--include-external');
      }
      if (maxPages !== undefined && maxPages !== null) {
          args.push('--max-pages', String(maxPages));
      }
      if (stream) {
          args.push('--stream');
      }
  } else {
      // Ensure other deep crawl args aren't passed if no strategy is set
      if (maxDepth !== undefined || includeExternal || maxPages !== undefined || stream) {
           console.warn('Warning: deep crawl options (maxDepth, includeExternal, maxPages, stream) were provided without a --deep-crawl-strategy. They will be ignored.');
      }
  }

  // --- Add New Config Arguments ---
  // Note: headless defaults to true in Python script via argparse.
  // Only add --no-headless if the user explicitly sets headless: false.
  if (headless === false) { 
      args.push('--no-headless');
  }
  if (userAgent) {
      args.push('--user-agent', userAgent);
  }
  if (textMode) {
      args.push('--text-mode');
  }
  if (lightMode) {
      args.push('--light-mode');
  }
  if (waitFor) {
      args.push('--wait-for', waitFor);
  }
  if (screenshot) {
      args.push('--screenshot');
  }
  if (pdf) {
      args.push('--pdf');
  }
  if (jsCode) {
      args.push('--js-code', jsCode);
  }
  if (wordCountThreshold !== undefined && wordCountThreshold !== null) {
      args.push('--word-count-threshold', String(wordCountThreshold));
  }

  return new Promise(async (resolve, reject) => {
    console.log(`Spawning: ${pythonExecutable} ${args.join(' ')} (output to: ${tempFilePath})`);
    const env = { ...process.env, PYTHONIOENCODING: 'UTF-8' };

    const pythonProcess = spawn(pythonExecutable, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env
    });

    let stderrData = '';
    pythonProcess.stderr.setEncoding('utf8');
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data;
    });

    pythonProcess.on('close', async (code) => {
      console.log(`Python script exited with code ${code}`);
      if (stderrData) {
        console.warn(`Python script stderr:\n${stderrData}`); 
      }

      if (code !== 0) {
        try { await fs.unlink(tempFilePath); } catch (cleanupErr) { console.warn(`Failed to cleanup temp file ${tempFilePath}: ${cleanupErr}`); }
        return reject(new Error(`Python script exited with code ${code}. Stderr: ${stderrData || 'None'}`));
      }

      try {
        const fileContent = await fs.readFile(tempFilePath, 'utf8');
        try { await fs.unlink(tempFilePath); } catch (cleanupErr) { console.warn(`Failed to cleanup temp file ${tempFilePath}: ${cleanupErr}`); }

        if (outputMode === 'json') {
          try {
            const jsonData = JSON.parse(fileContent);
            resolve(jsonData);
          } catch (parseError: any) {
            // Provide more context in the error, especially for deep crawls returning lists
            const errorHint = deepCrawlStrategy ? "Deep crawl likely returned multiple results or an error." : "";
            reject(new Error(`Failed to parse JSON from temp file: ${parseError.message}. ${errorHint} File content length: ${fileContent?.length || 0}. Stderr: ${stderrData || 'None'}`));
          }
        } else {
          resolve(fileContent);
        }
      } catch (readFileError: any) {
        try { await fs.unlink(tempFilePath); } catch (cleanupErr) { console.warn(`Failed to cleanup temp file ${tempFilePath}: ${cleanupErr}`); }
        reject(new Error(`Failed to read output file ${tempFilePath}: ${readFileError.message}. Stderr: ${stderrData || 'None'}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python script '${pythonExecutable}': ${err.message}`));
    });
  });
}

// Example Usage (remove or comment out in production)
async function example() {
    // Example 1: JSON Extraction using schema file
    const schemaFilePath = path.join(__dirname, 'example-schema.json'); // Create this file!
    const schemaContent = {
        name: "Example Extraction",
        baseSelector: "div",
        fields: [{ name: "title", selector: "h1", type: "text" }]
    };
    try {
        await fs.writeFile(schemaFilePath, JSON.stringify(schemaContent, null, 2));
        console.log(`Attempting JSON crawl on https://example.com using schema file...`);
        const jsonData = await crawlAndExtract('https://example.com', {
            outputMode: 'json',
            schemaPath: schemaFilePath, // Pass path to schema
            // bypassCache: true, // Example flag
            // verbose: true      // Example flag
        });
        console.log('Extracted JSON data:', JSON.stringify(jsonData, null, 2));
    } catch (error) {
        console.error('JSON Crawling failed:', error);
    } finally {
        try { await fs.unlink(schemaFilePath); } catch {} // Cleanup schema file
    }

    // Example 2: Markdown Generation
    const markdownTestUrl = 'https://www.nbcnews.com/business';
    try {
        console.log(`\nAttempting Markdown crawl on ${markdownTestUrl}...`);
        const markdownData = await crawlAndExtract(markdownTestUrl, {
            outputMode: 'markdown'
        });
        console.log('Generated Markdown (first 500 chars):', markdownData.substring(0, 500) + '...');
    } catch (error) {
        console.error('Markdown Crawling failed:', error);
    }

    // Example 3: Deep Crawl (BFS)
    const deepCrawlUrl = 'https://docs.crawl4ai.com/core/simple-crawling/'; // Use a page with links
    try {
        console.log(`\nAttempting Deep Crawl (BFS, depth 1) on ${deepCrawlUrl}...`);
        const deepMarkdown = await crawlAndExtract(deepCrawlUrl, {
            outputMode: 'markdown',
            deepCrawlStrategy: 'bfs',
            maxDepth: 1,
            // maxPages: 5, // Example limit
            // stream: true, // Example stream
        });
        console.log('Deep Crawl Results (Concatenated Markdown, first 500 chars):\n', deepMarkdown.substring(0, 500) + '...');

         console.log(`\nAttempting Deep Crawl (BFS, depth 1) with JSON output on ${deepCrawlUrl}...`);
         // Requires a schema that works across multiple pages potentially
          const deepJson = await crawlAndExtract(deepCrawlUrl, {
            outputMode: 'json',
            schemaPath: schemaFilePath, // Reusing example schema - adjust for real use!
            deepCrawlStrategy: 'bfs',
            maxDepth: 1,
         });
        console.log('Deep Crawl JSON results (list):', JSON.stringify(deepJson, null, 2));

    } catch (error) {
        console.error('Deep Crawling failed:', error);
    }

} // End of example function

// example(); // Uncomment to run the example function 