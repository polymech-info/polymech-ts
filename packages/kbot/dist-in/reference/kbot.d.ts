import { TemplateProps, TemplateContext } from "./kbot-templates.js";
export interface Props extends TemplateProps {
    context?: TemplateContext;
}
export declare const filter: (content: string, tpl?: string, opts?: Props) => Promise<any>;
export declare const template_filter: (text: string, template: string, context?: TemplateContext) => Promise<any>;
export declare const getFilterOptions: (content: string, template: any, opts?: Props) => any;
