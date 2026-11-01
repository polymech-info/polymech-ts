import { generate_interfaces } from '@polymech/commons'

import { 
    FileListingOptionsSchema, 
    FileRemovalOptionsSchema,
    GitCommitSchema,
    GitRevertSchema,
    GitSwitchVersionSchema,
    InvokeToolSchema,
    ToolListingOptionsSchema,
    TerminalCommandSchema,
    ListCommandSchema,
    NpmRunSchema
} from '../zod_schemas.js'

export const types = async () => {
    return generate_interfaces([
        FileListingOptionsSchema,
        FileRemovalOptionsSchema,
        GitCommitSchema,
        GitRevertSchema,
        GitSwitchVersionSchema,
        InvokeToolSchema,
        ToolListingOptionsSchema,
        TerminalCommandSchema,
        ListCommandSchema,
        NpmRunSchema
    ], 'src/zod_types.ts')
}