import type { SourceLanguageCode, TargetLanguageCode } from 'deepl-node';
import type { MdNodeType } from './ast/mdast.js';
export interface ConfigBase {
    /**
     * Source's language code. Based on DeepL supported languages.
     */
    sourceLanguage: SourceLanguageCode;
    /**
     * Output's languages code. Based on DeepL supported languages.
     */
    outputLanguages: TargetLanguageCode[];
    /**
     * Sources and ouputs directories pairs. $langcode$ variable
     * is provided to dynamically define directory.
     *
     * e.g. [ ["docs", "i18n/$langcode$/docs"], ["blog", "i18n/$langcode$/blog"] ]
     */
    directories: [string, string][];
}
export interface Config extends ConfigBase {
    /**
     * Override current working directory, defaults to `process.cwd()`.
     */
    cwd: string;
    /**
     * By default, all .md, .mdx, .json, and .yaml|.yml files inside
     * source directories will be included.
     *
     * Define glob patterns to filter what files to include or exclude.
     * But, the end result is still restricted by file types (.md, .mdx, .json).
     */
    files: {
        include?: string[];
        exclude: string[];
    };
    /**
     * Frontmatter fields.
     */
    frontmatterFields: {
        include: string[];
        exclude: string[];
    };
    /**
     * Markdown node types to include or exclude based on MDAST. Defaults to exclude `code` and `link`.
     */
    markdownNodes: {
        default: boolean;
        include: MdNodeType[];
        exclude: MdNodeType[];
    };
    /**
     * HTML elements to include and exlcude, down to the level of attributes
     * and children. Include all HTML elements text content
     * and some global attributes such as title and placeholder.
     */
    htmlElements: {
        include: Partial<{
            [Tag in HtmlTag]: {
                children: boolean;
                attributes: string[];
            };
        }>;
        exclude: HtmlTag[];
    };
    /**
     * JSX components to include and exclude, down to the level of attributes
     * and children. Include all JSX components text children
     * and exclude all attributes by default.
     *
     * Support array, object, and jsx attribute value. For object and array value,
     * you can specify the access path starting with the attribute name
     * e.g. `items.description` to translate `items={[{description: "..."}]}.
     */
    jsxComponents: {
        default: boolean;
        include: {
            [Name: string]: {
                children: boolean;
                attributes: string[];
            };
        };
        exclude: string[];
    };
    /**
     * JSON or YAML file properties to include and exclude.
     * Exclude all properties by default.
     */
    jsonOrYamlProperties: {
        include: (string | number | symbol)[];
        exclude: (string | number | symbol)[];
    };
}
export interface UserConfig extends ConfigBase {
    /**
     * Override current working directory, defaults to `process.cwd()`.
     */
    cwd?: string;
    /**
     * By default, all .md, .mdx, .json, and .yaml|.yml files inside
     * source directories will be included.
     *
     * Define glob patterns to filter what files to include or exclude.
     * But, the end result is still restricted by file types (.md, .mdx, .json).
     */
    files?: {
        include?: string[];
        exclude?: string[];
    };
    /**
     * Frontmatter fields.
     */
    frontmatterFields?: {
        include?: string[];
        exclude?: string[];
    };
    /**
     * Markdown node types to include or exclude based on MDAST. Defaults to exclude `code` and `link`.
     */
    markdownNodes?: {
        default?: boolean;
        include?: MdNodeType[];
        exclude?: MdNodeType[];
    };
    /**
     * HTML elements to include and exlcude, down to the level of attributes
     * and children. Include all HTML elements text content
     * and some global attributes such as title and placeholder.
     */
    htmlElements?: {
        default?: boolean;
        include?: Partial<{
            [Tag in HtmlTag]: {
                children: boolean;
                attributes: string[];
            };
        }>;
        exclude?: HtmlTag[];
    };
    /**
     * JSX components to include and exclude, down to the level of attributes
     * and children. Include all JSX components text children
     * and exclude all attributes by default.
     *
     * Support array, object, and jsx attribute value. For object and array value,
     * you can specify the access path starting with the attribute name
     * e.g. `items.description` to translate `items={[{description: "..."}]}.
     */
    jsxComponents?: {
        default?: boolean;
        include?: {
            [Name: string]: {
                children: boolean;
                attributes: string[];
            };
        };
        exclude?: string[];
    };
    /**
     * JSON or YAML file properties to include and exclude.
     * Exclude all properties by default.
     */
    jsonOrYamlProperties?: {
        include?: string[];
        exclude?: string[];
    };
}
export type HtmlElementsConfig = {
    [Tag in HtmlTag]: {
        children: boolean;
        attributes: string[];
    };
};
export declare const HTML_ELEMENTS_CONFIG: HtmlElementsConfig;
export declare const HTML_TAGS: HtmlTag[];
export declare function isHtmlTag(name: string): name is HtmlTag;
export declare function resolveConfig({ sourceLanguage, outputLanguages, directories, cwd, files, markdownNodes, frontmatterFields, htmlElements, jsxComponents, jsonOrYamlProperties }: UserConfig): Config;
export declare function isFrontmatterFieldIncluded({ field, config }: {
    field: string;
    config: Config;
}): boolean;
export declare function isMarkdownNodeIncluded({ type, config }: {
    type: MdNodeType;
    config: Config;
}): boolean;
export declare function isHtmlElementIncluded({ tag, config }: {
    tag: HtmlTag;
    config: Config;
}): boolean;
export declare function isHtmlElementAttributeIncluded({ tag, attribute, config }: {
    tag: HtmlTag;
    attribute: string;
    config: Config;
}): boolean;
export declare function isHtmlElementChildrenIncluded({ tag, config }: {
    tag: HtmlTag;
    config: Config;
}): boolean;
export declare function isJsxComponentIncluded({ name, config }: {
    name: string;
    config: Config;
}): boolean;
export declare function isJsxComponentAttributeIncluded({ name, attribute, config }: {
    name: string;
    attribute: string;
    config: Config;
}): boolean;
export declare function isJsxComponentChildrenIncluded({ name, config }: {
    name: string;
    config: Config;
}): boolean;
export declare function isJsonOrYamlPropertyIncluded({ property, config }: {
    config: Config;
    property: string | number | symbol;
}): boolean;
export type HtmlTag = 'a' | 'abbr' | 'address' | 'article' | 'aside' | 'audio' | 'b' | 'bdi' | 'bdo' | 'blockquote' | 'body' | 'button' | 'canvas' | 'caption' | 'cite' | 'col' | 'colgroup' | 'data' | 'datalist' | 'dd' | 'del' | 'details' | 'dfn' | 'dialog' | 'div' | 'dl' | 'dt' | 'em' | 'fieldset' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'header' | 'html' | 'i' | 'input' | 'ins' | 'label' | 'legend' | 'li' | 'main' | 'mark' | 'meter' | 'nav' | 'ol' | 'optgroup' | 'output' | 'p' | 'progress' | 'q' | 'rp' | 's' | 'samp' | 'section' | 'select' | 'small' | 'span' | 'strong' | 'sub' | 'summary' | 'sup' | 'table' | 'tbody' | 'td' | 'template' | 'text-area' | 'tfoot' | 'th' | 'thead' | 'time' | 'title' | 'tr' | 'track' | 'u' | 'ul' | 'area' | 'base' | 'br' | 'code' | 'embed' | 'head' | 'hr' | 'iframe' | 'img' | 'kbd' | 'link' | 'meta' | 'noscript' | 'object' | 'param' | 'picture' | 'pre' | 'rt' | 'ruby' | 'script' | 'source' | 'style' | 'svg' | 'var' | 'video' | 'qbr';
