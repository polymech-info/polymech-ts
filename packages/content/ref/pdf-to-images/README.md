# @polymech/pdf

## Installation

1. **Clone the repository (optional):**
   ```bash
   git clone <repository-url> # Replace with your repository URL
   cd <directory-name> # e.g., cd pdf
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## CLI Usage

When running from within the cloned project directory after building:

```bash
npm start -- convert [options]
# or directly execute the built script
node dist/index.js convert [options]
```

*(Note: If you publish this package and install it elsewhere, you might execute it differently, potentially using `npx @polymech/pdf convert ...` if a `bin` entry is added to `package.json`)*

Available command: `convert` - Convert PDF to images

### Options for `convert` command:

*   `-i, --input <string>`: Input PDF file (required)
*   `-o, --output <string>`: Output directory prefix for images (required)
*   `--dpi <number>`: DPI for output images (default: 300)
*   `--format <string>`: Output image format (choices: 'png', 'jpg', default: 'png')
*   `-s, --startPage <number>`: First page to convert (1-based)
*   `-e, --endPage <number>`: Last page to convert (1-based, inclusive)

Example:

```bash
node dist/index.js convert -i mydocument.pdf -o output/image
```

This will generate images like `output/image_1.png`, `output/image_2.png`, etc.

Another example (using JPG format and 150 DPI):

```bash
node dist/index.js convert -i report.pdf -o images/report_page --format jpg --dpi 150
```

This generates `images/report_page_1.jpg`, `images/report_page_2.jpg`, etc.

Example specifying a page range (pages 3 to 5):

```bash
node dist/index.js convert -i long_doc.pdf -o pages/doc_pg --startPage 3 --endPage 5
```

This generates `pages/doc_pg_3.png`, `pages/doc_pg_4.png`, `pages/doc_pg_5.png`.

## API Usage

```typescript
import { convertPdfToImages, ImageFormat, PdfToImageOptions } from './dist/lib/pdf'; // Adjust path based on your project structure
import { readFile } from 'node:fs/promises';

async function example() {
  try {
    const pdfBuffer = await readFile('mydocument.pdf');

    const options: PdfToImageOptions = {
      outputPathPrefix: 'output/image',
      dpi: 300,
      format: 'png'
    };

    const outputFilePaths = await convertPdfToImages(pdfBuffer, options);
    console.log('Generated images:', outputFilePaths);
  } catch (error) {
    console.error('Error:', error);
  }
}

example();
```

Example using JPG format:

```typescript
import { convertPdfToImages, PdfToImageOptions } from './dist/lib/pdf'; // Adjust path
import { readFile } from 'node:fs/promises';
import { Logger } from 'tslog'; // Assuming you want logging

async function exampleJpg() {
  const logger = new Logger();
  try {
    const pdfBuffer = await readFile('report.pdf');
    const options: PdfToImageOptions = {
      outputPathPrefix: 'images/report_page',
      dpi: 150,
      format: 'jpg',
    };
    const outputFilePaths = await convertPdfToImages(pdfBuffer, options);
    logger.info('Generated JPG images:', outputFilePaths);
  } catch (error) {
    logger.error('Error generating JPGs:', error);
  }
}

exampleJpg();
```

Example with specific page range:

```typescript
import { convertPdfToImages, PdfToImageOptions } from './dist/lib/pdf'; // Adjust path
import { readFile } from 'node:fs/promises';

async function examplePageRange() {
  try {
    const pdfBuffer = await readFile('long_doc.pdf');
    const options: PdfToImageOptions = {
      outputPathPrefix: 'pages/doc_pg',
      dpi: 200,
      format: 'png',
      startPage: 3,
      endPage: 5
    };
    const outputFilePaths = await convertPdfToImages(pdfBuffer, options);
    console.log('Generated specific pages:', outputFilePaths);
  } catch (error) {
    console.error('Error generating page range:', error);
  }
}

examplePageRange();
```

### Exports

*   `convertPdfToImages(pdfData: Buffer, options: PdfToImageOptions): Promise<string[]>`: Converts a PDF buffer to images.
*   `ImageFormat`: Type alias for `'png' | 'jpg'`.
*   `PdfToImageOptions`: Interface for conversion options (`outputPathPrefix`, `dpi`, `format`, optional `startPage`, optional `endPage`, optional `logger`).


### References

- https://github.com/opendatalab/PDF-Extract-Kit/tree/main/project/pdf2markdown (Using Yolo)
