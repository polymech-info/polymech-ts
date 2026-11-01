import { z } from 'zod';
/** Schema for listing files in a directory */
export declare const FileListingOptionsSchema: z.ZodObject<{
    directory: z.ZodString;
    pattern: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** Schema for file removal operations */
export declare const FileRemovalOptionsSchema: z.ZodObject<{
    path: z.ZodString;
}, z.core.$strip>;
/** Schema for git commit operations */
export declare const GitCommitSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodString>;
    message: z.ZodString;
}, z.core.$strip>;
/** Schema for git revert operations */
export declare const GitRevertSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
/** Schema for git version switch operations */
export declare const GitSwitchVersionSchema: z.ZodObject<{
    branch: z.ZodString;
    remote: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
/** Schema for git raw file retrieval */
export declare const GitRawFileSchema: z.ZodObject<{
    url: z.ZodOptional<z.ZodString>;
    repo: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** Schema for npm run command */
export declare const NpmRunSchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/** Schema for terminal command execution */
export declare const TerminalCommandSchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString>>;
    cwd: z.ZodOptional<z.ZodString>;
    background: z.ZodOptional<z.ZodBoolean>;
    window: z.ZodOptional<z.ZodBoolean>;
    detached: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/** Schema for tool invocation parameters */
export declare const InvokeToolSchema: z.ZodObject<{
    tools: z.ZodString;
    function: z.ZodString;
    target: z.ZodDefault<z.ZodString>;
    params: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    env_key: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/** Schema for list command options */
export declare const ListCommandSchema: z.ZodObject<{
    output: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
/** Schema for tool listing options */
export declare const ToolListingOptionsSchema: z.ZodObject<{
    output: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
