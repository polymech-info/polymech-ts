# @plastichub/kbot

AI-powered command-line tool for code modifications and project management that supports multiple AI models and routers.

## Overview

Code-bot is a powerful CLI tool that helps developers automate code modifications, handle project management tasks, and integrate with various AI models for intelligent code and content assistance.

## Quick Start

### Installation Steps

KBot requires Node.js to run. It's recommended to use Node.js version 18 or higher.

1. Visit the official [Node.js website](https://nodejs.org/)
2. Download the LTS (Long Term Support) version for your operating system
3. Follow the installation wizard
4. Verify installation by opening a terminal and running:
   ```bash
   node --version
   npm --version
   ```

### API Keys

KBot supports both OpenRouter and OpenAI APIs. You'll need at least one of these set up.

#### OpenRouter API (Recommended)

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to the API Keys section
4. Create a new API key

#### OpenAI API (Optional)

1. Go to [OpenAI's platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API keys section
4. Create a new secret key

### Installation using Node NPM package manager

```bash
npm install -g @plastichub/kbot
```

## Configuration

### API Keys Setup

Create configuration at `$HOME/.osr/.config.json` (or export OSR_CONFIG with path to config.json):

```json
{
  "openrouter": {
    "key": "your-openrouter-key"
  },
  "openai": {
    "key": "your-openai-key"
  },
   "email": {
      "newsletter": {
          "host": "host.org",
          "port": 465,
          "debug": true,
          "transactionLog": true,
          "auth": {
              "user": "foo@bar.com",
              "pass": "pass"
          }
      }
  },
  "google": {
      "cse": "custom search engine id",
      "api_key": "google custom search api key"
  },
  "serpapi": {
      "key": "your SerpAPI key (optional, used for web searches(places, google maps))"
  },
  "deepseek": {
      "key": "your SerpAPI key (optional, used for web searches(places, google maps))"
  },
}
```

### Preferences Setup

Optionally, create `.kbot/preferences.md` in your project directory to customize AI interactions:

```markdown
## My Preferences

Gender : male
Location : New York, USA (eg: `send me all saunas next to me`)
Language : English
Occupation : software developer, Typescript
Age : 30+

## Contacts

My email address : example@email.com (eg: `send me latest hacker news`)
My wife's email address ("Anne") : example@email.com (eg: `send email to my wife, with latest local news')

## Content

When creating content
- always Markdown
- always add links
- when sending emails, always add 'Best regards, [Your Name]'
```
# Main Commands

The primary way to interact with `kbot` for processing tasks is by invoking it with a prompt and various options. While often used implicitly, this typically corresponds to the `run` command.

## Running Tasks

```bash
kbot run [options...] "Your prompt here..."
# or simply (if 'run' is the default):
kbot [options...] "Your prompt here..."
```

This command executes the main AI processing pipeline based on the provided prompt and options. Key aspects controlled by options include:

*   **Input:** Specified via `--include` (files, directories, web URLs), `--path`.
*   **Task:** Defined by the `--prompt`.
*   **Behavior:** Controlled by `--mode` (e.g., `tools`, `completion`).
*   **Output:** Directed using `--dst` or `--output`.
*   **Model & API:** Configured with `--model`, `--router`, `--api_key`, etc.

Refer to [Parameters](./parameters.md) and [Modes](./modes.md) for detailed options.

## Utility Commands

Other potential utility commands might include:

*   `kbot fetch`: Fetch updated information, such as the latest available models.
*   `kbot init`: Initialize a directory or project for use with `kbot` (e.g., create default config files).
*   `kbot help-md`: Generate extended help documentation in Markdown format.
*   `kbot examples`: Show example usage patterns.

*(Note: Availability and exact behavior of utility commands may vary.)*
# Command Line Parameters

This document describes the command line parameters available for `kbot`.

**Note:** Many parameters support environment variable substitution (e.g., `${VAR_NAME}`).

## Core Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `prompt`  | The main instruction or question for the AI. Can be a string, a file path (e.g., `file:./my_prompt.md`), or an environment variable. | - | Yes (or implied by context) |
| `model`   | AI model ID to use for processing (e.g., `openai/gpt-4o`). See available models via helper functions or router documentation. | Depends on router/config | No |
| `router`  | The API provider to use. | `openrouter` | No |
| `mode`    | The operational mode. See [Modes](./modes.md) for details. | `tools` | No |

## Input & File Selection

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `path`    | Target directory for local file operations or context. | `.` | No |
| `include` | Specify input files or content. Accepts comma-separated glob patterns (e.g., `src/**/*.ts`), file paths, directory paths, or **web URLs** (e.g., `https://example.com/page`). | `[]` | No |
| `exclude` | Comma-separated glob patterns or paths to exclude from processing (e.g., `src/**/*.test.ts,temp/`). | `[]` | No |
| `globExtension` | Specify a glob extension behavior to find related files. Available presets: `match-cpp`. Also accepts a custom glob pattern with variables like `${SRC_DIR}`, `${SRC_NAME}`, `${SRC_EXT}` (e.g., `"${SRC_DIR}/${SRC_NAME}*.h"` to find headers for a .cpp file). | - | No |
| `query`   | JSONPath query to extract specific data from input objects (often used with structured input files). | `null` | No |

## Output & Formatting

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `output`  | Output path for modified files (primarily for `tools` mode operations like refactoring). | - | No |
| `dst`     | Destination path/filename for the main result (primarily for `completion` or `assistant` mode). Supports `${MODEL_NAME}` and `${ROUTER}` substitutions. | - | No |
| `format`  | Defines the desired structure for the AI's output. Can be a Zod schema object, a Zod schema string, a JSON schema string, or a path to a JSON schema file (e.g., `file:./schema.json`). Ensures the output conforms to the specified structure. | - | No |
| `filters` | Post-processing filters applied to the output (primarily `completion` mode with `--dst`). Can be a comma-separated string of filter names (e.g., `unwrapMarkdown,trim`). | `''` | No |

## Tool Usage

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `tools`   | Comma-separated list of tool names or paths to custom tool files to enable. | (List of default tools) | No |
| `disable` | Comma-separated list of tool *categories* to disable (e.g., `filesystem,git`). | `[]` | No |
| `disableTools` | Comma-separated list of specific tool *names* to disable. | `[]` | No |

## Iteration & Advanced Control

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `each`    | Iterate the task over multiple items. Accepts a GLOB pattern, path to a JSON file (array), or comma-separated strings. The current item is available as the `${ITEM}` variable in other parameters (e.g., `--dst="${ITEM}-output.md"`). Can be used to test different models (e.g., `--each="openai/gpt-3.5-turbo,openai/gpt-4o"`). | - | No |
| `variables` | Define custom key-value variables for use in prompts or other parameters (e.g., `--variables.PROJECT_NAME=MyProject`). Access via `${variableName}`. | `{}` | No |

## Configuration & Authentication

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `api_key` | Explicit API key for the selected router. Overrides keys from config files. | - | No |
| `baseURL` | Custom base URL for the API endpoint (e.g., for local LLMs via Ollama). Set automatically for known routers or can be specified directly. | - | No |
| `config`  | Path to a JSON configuration file containing API keys and potentially other settings. | - | No |
| `profile` | Path to a profile file (JSON or .env format) for loading environment-specific variables. | - | No |
| `env`     | Specifies the environment section to use within the profile file. | `default` | No |
| `preferences` | Path to a preferences file (e.g., containing user details like location, email). Used to provide context to the AI. | (System-specific default, often `~/.kbot/Preferences`) | No |

## Debugging & Logging

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `logLevel` | Logging verbosity level (e.g., 0=error, 4=debug). | `4` | No |
| `logs`    | Directory to store log files and temporary outputs (like `params.json`). | `./logs` | No |
| `dry`     | Perform a dry run: log parameters and configurations without executing the AI request. | `false` | No |
| `dump`    | Path to generate a script file representing the current command invocation. | - | No |

# Advanced Topics

This section covers more advanced usage patterns and concepts.

## Processing Multiple Items (`--each`)

Instead of relying on external scripting for batch processing, `kbot` provides the built-in `--each` parameter. This allows you to iterate a task over multiple inputs efficiently.

**How it Works:**

The `--each` parameter accepts:

*   A comma-separated list of strings (e.g., `--each="file1.txt,file2.txt"`).
*   A file path to a JSON file containing an array of strings.
*   A GLOB pattern matching multiple files (e.g., `--each="./src/**/*.ts"`).
*   A list of model IDs to test a prompt against different models (e.g., `--each="openai/gpt-4o,anthropic/claude-3.5-sonnet"`).

**Using the `${ITEM}` Variable:**

Within the loop initiated by `--each`, the current item being processed is available as the `${ITEM}` variable. You can use this variable in other parameters, such as `--dst`, `--include`, or within the `--prompt` itself.

**Example: Generating Documentation for Multiple Files**

```bash
kbot --each "./src/modules/*.ts" \
     --dst "./docs/api/${ITEM}.md" \
     --prompt "Generate API documentation in Markdown format for the module defined in ${ITEM}"
```

This command will:

1.  Find all `.ts` files in `./src/modules/`.
2.  For each file (e.g., `moduleA.ts`):
    *   Set `${ITEM}` to the file path (`./src/modules/moduleA.ts`).
    *   Execute `kbot` with the prompt, including the specific file via `${ITEM}`.
    *   Save the output to `./docs/api/./src/modules/moduleA.ts.md` (Note: path handling might vary).

Refer to the [Examples](./examples.md#iterating-with---each) for more use cases.

## Choosing a Transformation Method: `transform` vs. `createIterator`

When transforming data structures (often JSON) using LLMs, you have two primary approaches:

1.  **`transform` Helper Function:**
    *   **Pros:** Simple, minimal setup, good for basic field transformations.
    *   **Cons:** Less control over network, caching, logging details.
    *   **Use Case:** Quickly applying straightforward transformations to data fields without needing deep customization.

2.  **`createIterator` Factory:**
    *   **Pros:** Full control over network options (retries, concurrency), caching (namespace, expiration), logging, custom transformer logic, and callbacks (`onTransform`, `onTransformed`).
    *   **Cons:** More verbose setup required.
    *   **Use Case:** Complex transformations requiring fine-tuned control over the entire process, advanced caching strategies, or integration with custom logging/transformation logic.

Consult the [Iterator Documentation](./iterator.md) for detailed explanations and code examples of both methods.