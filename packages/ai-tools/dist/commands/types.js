import { generate_interfaces } from '@polymech/commons';
import { FileListingOptionsSchema, FileRemovalOptionsSchema, GitCommitSchema, GitRevertSchema, GitSwitchVersionSchema, InvokeToolSchema, ToolListingOptionsSchema, TerminalCommandSchema, ListCommandSchema, NpmRunSchema } from '../zod_schemas.js';
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
    ], 'src/zod_types.ts');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFdkQsT0FBTyxFQUNILHdCQUF3QixFQUN4Qix3QkFBd0IsRUFDeEIsZUFBZSxFQUNmLGVBQWUsRUFDZixzQkFBc0IsRUFDdEIsZ0JBQWdCLEVBQ2hCLHdCQUF3QixFQUN4QixxQkFBcUIsRUFDckIsaUJBQWlCLEVBQ2pCLFlBQVksRUFDZixNQUFNLG1CQUFtQixDQUFBO0FBRTFCLE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRTtJQUM1QixPQUFPLG1CQUFtQixDQUFDO1FBQ3ZCLHdCQUF3QjtRQUN4Qix3QkFBd0I7UUFDeEIsZUFBZTtRQUNmLGVBQWU7UUFDZixzQkFBc0I7UUFDdEIsZ0JBQWdCO1FBQ2hCLHdCQUF3QjtRQUN4QixxQkFBcUI7UUFDckIsaUJBQWlCO1FBQ2pCLFlBQVk7S0FDZixFQUFFLGtCQUFrQixDQUFDLENBQUE7QUFDMUIsQ0FBQyxDQUFBIn0=