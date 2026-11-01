# LLM Tools CLI

Command-line interface and library for LLM tools providing filesystem, npm, git, terminal, interactive user, and screen capture operations.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm run build
```

3. Configure environment:
Either set environment variable:
```bash
export OPENAI_API_KEY=your-key-here
```
Or create a configuration file (e.g. `.env.dev.json`):
```json
{
  "openai": {
    "key": "your-key-here"
  }
}
```
Then use with --env_key parameter:
```bash
pnpm start invoke --env_key dev
```

## Available Commands

### Generate TypeScript Types
Generates TypeScript interfaces from Zod schemas:
```bash
pnpm run types
```

### List Available Tools
Show all available tools and their descriptions:
```bash
pnpm start list

# Write tools list to file
pnpm start list --output ./tools.json
```

### Invoke Tool Functions
Invoke specific tool functions:
```bash
pnpm start invoke \
  --tools fs \
  --function list_files \
  --target ./src \
  --params '{"directory":".","pattern":"**/*.ts"}'
```

## Available Tools

### Filesystem Tools (fs)
- `list_files`: List all files in a directory with optional glob pattern
- `remove_file`: Remove a file at given path
- `rename_file`: Rename or move a file or directory
- `modify_project_files`: Modify existing project files with given content
- `create_project_structure`: Create project structure with files and folders
- `create_file`: Creates a file with given path and content
- `read_file`: Read content of a file at given path

### NPM Tools (npm)
- `build_project`: Build project using pnpm build command
- `run_npm`: Run an npm/pnpm command with optional arguments
- `install_dependency`: Install project dependencies using pnpm

### Git Tools (git)
- `init_repository`: Initialize a new git repository if it doesn't exist
- `commit_files_git`: Commit and push files to git repository with specified message

### Terminal Tools (terminal)
- `execute_command`: Execute terminal commands with options:
  - Run in background (non-blocking)
  - Open in new window
  - Run detached from parent process
  - Specify working directory

### Interactive Tools (interact)
- `ask_question`: Ask user a simple question and get response
- `choose_option`: Ask user to choose from multiple options:
  - Single selection mode
  - Multiple selection mode (checkbox)

### User Tools (user)
- `capture_screen`: Capture a screenshot of the entire screen or a specific region

## Project Structure
```
src/
  ├── commands/          # Command implementations
  │   ├── index.ts       # Command registry
  │   ├── invoke.ts      # Invoke command
  │   ├── list.ts        # List command
  │   └── types.ts       # Types command
  ├── lib/               # Core functionality
  │   └── tools/         # Tool implementations
  │       ├── fs.ts      # Filesystem tools
  │       ├── git.ts     # Git operations
  │       ├── npm.ts     # NPM commands
  │       ├── interact.ts # Interactive tools
  │       ├── user.ts    # User tools (screenshots)
  │       └── terminal.ts # Terminal operations
  ├── constants.ts       # Logger name constant
  ├── index.ts          # Logger setup
  ├── main.ts           # CLI entry point
  ├── tools.ts          # Tools registry
  ├── zod_schemas.ts    # Zod schemas
  └── zod_types.ts      # Generated TypeScript interfaces
```