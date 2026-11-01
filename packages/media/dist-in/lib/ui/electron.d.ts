export interface Result {
    editBoxValue: string;
    selectedTemplate: string;
    selectedFiles: string[];
    selectedModel: string;
}
export declare const web_prompt: (prompt: string, dst: string, variables?: any) => Promise<any>;
export declare const renderSchemaUI: (options: {
    schema: any;
    uiSchema?: any;
    formData?: any;
    title?: string;
    width?: number;
    height?: number;
    cliOptions?: any;
}) => Promise<any>;
