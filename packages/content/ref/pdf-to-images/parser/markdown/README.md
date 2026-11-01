# PDF to Markdown Integration

This directory contains the necessary setup and guidance for integrating the `pdf2markdown` tool from the [opendatalab/PDF-Extract-Kit](https://github.com/opendatalab/PDF-Extract-Kit/tree/main/project/pdf2markdown) repository.

## Setup Instructions

1.  **Clone the Repository:** Clone the `PDF-Extract-Kit` repository into a suitable location (e.g., a `vendor` directory or similar within this project, or manage it as a git submodule).

    ```bash
    # Example: Cloning into a vendor directory
    git clone https://github.com/opendatalab/PDF-Extract-Kit.git ../../vendor/PDF-Extract-Kit
    # Or using a submodule
    # git submodule add https://github.com/opendatalab/PDF-Extract-Kit.git vendor/PDF-Extract-Kit
    ```

2.  **Install Python Dependencies:** The `pdf2markdown` tool relies on several Python libraries. You need to have Python installed (check the repository for specific version requirements, likely Python 3.x). Set up a virtual environment and install the required packages. Navigate to the cloned repository directory. While the repository doesn't seem to have a top-level `requirements.txt`, you might need to install dependencies based on the components used (YOLOv8, UniMERNet, StructEqTable, PaddleOCR). You may need to piece together the requirements from the individual components or look for specific setup instructions within the `PDF-Extract-Kit` documentation if available.

    ```bash
    # Navigate to the cloned repo (adjust path as needed)
    cd ../../vendor/PDF-Extract-Kit

    # Create a virtual environment (recommended)
    python -m venv venv
    source venv/bin/activate # On Windows use `venv\Scripts\activate`

    # Install common dependencies (this is a guess, refer to PDF-Extract-Kit docs for specifics)
    # You'll likely need libraries for YOLO, OCR (PaddleOCR), etc.
    # pip install -r requirements.txt # Look for requirements files in subdirectories if they exist

    # Example: Install PaddleOCR (check their docs for CPU/GPU versions)
    # pip install paddlepaddle paddleocr

    # You will need to research and install the specific dependencies for YOLOv8,
    # UniMERNet, and StructEqTable as used by this project.
    ```

3.  **Configuration:** The tool uses a YAML configuration file (`project/pdf2markdown/configs/pdf2markdown.yaml`). You might need to adjust paths or settings within this file, especially if models need to be downloaded or paths to resources are specific to your environment.

## Usage from TypeScript CLI

You can execute the Python script from your TypeScript code using Node.js's `child_process` module.

```typescript
import { exec } from 'child_process';
import path from 'path';

async function convertPdfToMarkdown(pdfFilePath: string, outputMarkdownPath: string): Promise<void> {
  // Adjust these paths based on where you cloned the repo and the location of this script
  const repoRoot = path.resolve(__dirname, '../../vendor/PDF-Extract-Kit'); // Example path
  const scriptPath = path.join(repoRoot, 'project/pdf2markdown/scripts/run_project.py');
  const configPath = path.join(repoRoot, 'project/pdf2markdown/configs/pdf2markdown.yaml');
  const pythonExecutable = path.join(repoRoot, 'venv/bin/python'); // Or venv\Scripts\python.exe on Windows, or just 'python' if in PATH

  // Construct the command
  // IMPORTANT: You'll need to modify the run_project.py script or its config
  // to accept input PDF path and output MD path as arguments, or handle
  // input/output in a way that suits your CLI (e.g., reading config, environment variables).
  // The current script seems to rely solely on the config file.
  // For now, let's assume you modify the config file or the script handles it.
  // You might need to dynamically update the config file before running.

  // Placeholder command - needs refinement based on how run_project.py handles I/O
  const command = `${pythonExecutable} ${scriptPath} --config ${configPath} --input ${pdfFilePath} --output ${outputMarkdownPath}`; // Hypothetical arguments

  console.log(`Executing: ${command}`);

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing pdf2markdown: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        reject(error);
        return;
      }
      console.log(`Stdout: ${stdout}`);
      console.warn(`Stderr: ${stderr}`); // Log stderr even on success, as it might contain warnings
      resolve();
    });
  });
}

// Example usage in your CLI command:
// const inputPdf = 'path/to/your/input.pdf';
// const outputMd = 'path/to/your/output.md';
// convertPdfToMarkdown(inputPdf, outputMd)
//   .then(() => console.log('PDF converted to Markdown successfully.'))
//   .catch(err => console.error('Conversion failed:', err));

```

## Important Considerations

*   **Dependency Management:** Managing Python dependencies within a TypeScript project can be complex. Consider using Docker to encapsulate the Python environment or ensuring clear setup steps for developers.
*   **Script Modification:** The provided `run_project.py` script seems tailored to use its YAML config file directly. You will likely need to modify this Python script (or the way it's called) to accept input PDF file paths and desired output Markdown file paths as command-line arguments for seamless integration into your CLI.
*   **Error Handling:** Robust error handling is crucial. The Python script might fail for various reasons (invalid PDF, missing dependencies, model errors). Ensure your TypeScript wrapper handles errors from the child process gracefully.
*   **Performance:** Executing a Python process involves overhead. For high-throughput scenarios, explore potential optimizations or alternative libraries.
*   **Model Downloads:** The underlying models (YOLO, etc.) might require downloading large files during the first run or setup. Account for this in your setup instructions and potentially during the first execution from your CLI. 