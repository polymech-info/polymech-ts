import { z } from 'zod';
/** Schema for listing files in a directory */
export const FileListingOptionsSchema = z.object({
    directory: z.string().describe('Directory path to list files from'),
    pattern: z.string().optional().describe('Glob pattern for filtering files')
}).describe('IFileListingOptions');
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
}).refine(data => (data.url) || (data.repo && data.path), 'Either url or both repo and path must be provided').describe('IGitRawFileOptions');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9kX3NjaGVtYXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvem9kX3NjaGVtYXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLENBQUMsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUV4Qiw4Q0FBOEM7QUFDOUMsTUFBTSxDQUFDLE1BQU0sd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxTQUFTLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxtQ0FBbUMsQ0FBQztJQUNuRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxrQ0FBa0MsQ0FBQztDQUM5RSxDQUFDLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUE7QUFFbEMseUNBQXlDO0FBQ3pDLE1BQU0sQ0FBQyxNQUFNLHdCQUF3QixHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDN0MsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLENBQUM7Q0FDMUQsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBRW5DLHVDQUF1QztBQUN2QyxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNwQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7SUFDdEQsT0FBTyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7Q0FDakQsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBRWpDLHVDQUF1QztBQUN2QyxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNw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