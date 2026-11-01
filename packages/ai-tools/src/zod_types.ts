export interface IFileListingOptions {
    /** Directory path to list files from */
    directory: string;
    /** Glob pattern for filtering files */
    pattern?: string | undefined;
}
export interface IFileRemovalOptions {
    /** Path of the file to remove */
    path: string;
}
export interface IGitCommitOptions {
    /** Files to commit */
    files: string[];
    /** Commit message */
    message: string;
}
export interface IGitRevertOptions {
    /** Files to revert */
    files: string[];
}
export interface IGitSwitchVersionOptions {
    /** Branch name to switch to */
    branch: string;
    /** Remote name */
    remote: string;
}
export interface IInvokeToolOptions {
    /** Tool category to use (fs, npm, git, terminal) */
    tools: string;
    /** Function name to invoke */
    function: string;
    /** Target directory */
    target: string;
    /** JSON string of parameters */
    params?: string | undefined;
    /** Path to write the output to */
    output?: string | undefined;
    /** Environment configuration key */
    env_key?: string | undefined;
}
export interface IToolListingOptions {
    /** Path to write the output to */
    output: string;
}
export interface ITerminalCommandOptions {
    /** Command to execute */
    command: string;
    /** Command arguments */
    args?: string[] | undefined;
    /** Working directory for command execution */
    cwd?: string | undefined;
    /** Run command in background (non-blocking) */
    background?: boolean | undefined;
    /** Open command in new terminal window */
    window?: boolean | undefined;
    /** Run process detached from parent */
    detached?: boolean | undefined;
}
export interface IListCommandOptions {
    /** Output file path for tools list */
    output: string;
}
export interface INpmRunOptions {
    /** Command to run (e.g. install, test, etc) */
    command: string;
    /** Additional arguments for the command */
    args?: string[] | undefined;
}