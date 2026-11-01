import { z } from 'zod';

/** Schema for listing files in a directory */
export const FileListingOptionsSchema = z.object({
    directory: z.string().describe('Directory path to list files from'),
    pattern: z.string().optional().describe('Glob pattern for filtering files')
}).describe('IFileListingOptions')

/** Schema for file removal operations */
export const FileRemovalOptionsSchema = z.object({
    path: z.string().describe('Path of the file to remove')
}).describe('IFileRemovalOptions');

/** Schema for git commit operations */
export const GitCommitSchema = z.object({
    files: z.array(z.string()).describe('Files to commit'),
    message: z.string().describe('Commit message')
}).describe('IGitCommitOptions');

/** Schema for git revert operations */
export const GitRevertSchema = z.object({
    files: z.array(z.string()).describe('Files to revert')
}).describe('IGitRevertOptions');

/** Schema for git version switch operations */
export const GitSwitchVersionSchema = z.object({
    branch: z.string().describe('Branch name to switch to'),
    remote: z.string().default('origin').describe('Remote name')
}).describe('IGitSwitchVersionOptions');

/** Schema for git raw file retrieval */
export const GitRawFileSchema = z.object({
    url: z.string().optional().describe('Full GitHub raw URL'),
    repo: z.string().optional().describe('Repository in format owner/repo'),
    path: z.string().optional().describe('File path within repository')
}).refine(
    data => (data.url) || (data.repo && data.path),
    'Either url or both repo and path must be provided'
).describe('IGitRawFileOptions');

/** Schema for npm run command */
export const NpmRunSchema = z.object({
    command: z.string().describe('Command to run (e.g. install, test, etc)'),
    args: z.array(z.string()).optional().describe('Additional arguments for the command')
}).describe('INpmRunOptions');

/** Schema for terminal command execution */
export const TerminalCommandSchema = z.object({
    command: z.string().describe('Command to execute'),
    args: z.array(z.string()).optional().describe('Command arguments'),
    cwd: z.string().optional().describe('Working directory for command execution'),
    background: z.boolean().optional().describe('Run command in background (non-blocking)'),
    window: z.boolean().optional().describe('Open command in new terminal window'),
    detached: z.boolean().optional().describe('Run process detached from parent')
}).describe('ITerminalCommandOptions');

/** Schema for tool invocation parameters */
export const InvokeToolSchema = z.object({
    tools: z.string().describe('Tool category to use (fs, npm, git, terminal)'),
    function: z.string().describe('Function name to invoke'),
    target: z.string().default(process.cwd()).describe('Target directory'),
    params: z.string().optional().describe('JSON string of parameters'),
    output: z.string().optional().describe('Path to write the output to'),
    env_key: z.string().optional().describe('Environment configuration key')
}).describe('IInvokeToolOptions');

/** Schema for list command options */
export const ListCommandSchema = z.object({
    output: z.string().default("./llm-tools.json").describe('Output file path for tools list')
}).describe('IListCommandOptions');

/** Schema for tool listing options */
export const ToolListingOptionsSchema = z.object({
    output: z.string().default('./llm-tools.json').describe('Path to write the output to')
}).describe('IToolListingOptions');