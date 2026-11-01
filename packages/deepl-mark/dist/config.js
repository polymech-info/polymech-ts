import { isBoolean } from "./utils.js";
const HTML_ELEMENTS_CONFIG = getHtmlElementsConfig();
function getHtmlElementsConfig() {
  const includeChildren = [
    "a",
    "abbr",
    "address",
    "article",
    "aside",
    "audio",
    "b",
    "bdi",
    "bdo",
    "blockquote",
    "body",
    "button",
    "canvas",
    "caption",
    "cite",
    "col",
    "colgroup",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "div",
    "dl",
    "dt",
    "em",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "html",
    "i",
    "input",
    "ins",
    "label",
    "legend",
    "li",
    "main",
    "mark",
    "meter",
    "nav",
    "ol",
    "optgroup",
    "output",
    "p",
    "progress",
    "q",
    "rp",
    "s",
    "samp",
    "section",
    "select",
    "small",
    "span",
    "strong",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "text-area",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "u",
    "ul"
  ];
  const excludeChildren = [
    "area",
    "base",
    "br",
    "code",
    "embed",
    "head",
    "hr",
    "iframe",
    "img",
    "kbd",
    "link",
    "meta",
    "noscript",
    "object",
    "param",
    "picture",
    "pre",
    "rt",
    "ruby",
    "script",
    "source",
    "style",
    "svg",
    "var",
    "video",
    "qbr"
  ];
  const config = {};
  for (const tag of includeChildren) {
    config[tag] = {
      children: true,
      attributes: ["title"]
    };
  }
  for (const tag of excludeChildren) {
    config[tag] = {
      children: false,
      attributes: ["title"]
    };
  }
  return config;
}
const HTML_TAGS = Object.keys(HTML_ELEMENTS_CONFIG);
function isHtmlTag(name) {
  return HTML_TAGS.includes(name);
}
function resolveConfig({
  sourceLanguage,
  outputLanguages,
  directories,
  cwd,
  files,
  markdownNodes,
  frontmatterFields,
  htmlElements,
  jsxComponents,
  jsonOrYamlProperties
}) {
  return {
    sourceLanguage,
    outputLanguages,
    directories,
    cwd: cwd ?? "",
    files: files ? {
      include: files.include,
      exclude: files.exclude ?? []
    } : { exclude: [] },
    markdownNodes: markdownNodes ? {
      default: isBoolean(markdownNodes.default) ? markdownNodes.default : true,
      include: markdownNodes.include ?? [],
      exclude: markdownNodes.exclude ?? ["code"]
    } : { default: true, include: [], exclude: ["code"] },
    frontmatterFields: frontmatterFields ? {
      include: frontmatterFields.include ?? [],
      exclude: frontmatterFields.exclude ?? []
    } : { include: [], exclude: [] },
    htmlElements: htmlElements ? {
      include: htmlElements.include ? isBoolean(htmlElements.default) && htmlElements.default || htmlElements.default === void 0 ? { ...HTML_ELEMENTS_CONFIG, ...htmlElements.include } : htmlElements.include : isBoolean(htmlElements.default) && !htmlElements.default ? {} : HTML_ELEMENTS_CONFIG,
      exclude: htmlElements.exclude ?? []
    } : { include: HTML_ELEMENTS_CONFIG, exclude: [] },
    jsxComponents: jsxComponents ? {
      default: isBoolean(jsxComponents.default) ? jsxComponents.default : true,
      include: jsxComponents.include ?? {},
      exclude: jsxComponents.exclude ?? []
    } : { default: true, include: {}, exclude: [] },
    jsonOrYamlProperties: jsonOrYamlProperties ? { include: jsonOrYamlProperties.include ?? [], exclude: jsonOrYamlProperties.exclude ?? [] } : { include: [], exclude: [] }
  };
}
function isFrontmatterFieldIncluded({
  field,
  config
}) {
  return !config.frontmatterFields.exclude.includes(field) && config.frontmatterFields.include.includes(field);
}
function isMarkdownNodeIncluded({
  type,
  config
}) {
  return !config.markdownNodes.exclude.includes(type) && (config.markdownNodes.default || config.markdownNodes.include.includes(type));
}
function isHtmlElementIncluded({ tag, config }) {
  return !config.htmlElements.exclude.includes(tag) && Object.keys(config.htmlElements.include).includes(tag);
}
function isHtmlElementAttributeIncluded({
  tag,
  attribute,
  config
}) {
  return isHtmlElementIncluded({ tag, config }) && config.htmlElements.include[tag].attributes.includes(attribute);
}
function isHtmlElementChildrenIncluded({
  tag,
  config
}) {
  return isHtmlElementIncluded({ tag, config }) && config.htmlElements.include[tag].children;
}
function isJsxComponentIncluded({
  name,
  config
}) {
  return !config.jsxComponents.exclude.includes(name) && (config.jsxComponents.default || Object.keys(config.jsxComponents.include).includes(name));
}
function isJsxComponentAttributeIncluded({
  name,
  attribute,
  config
}) {
  return !config.jsxComponents.exclude.includes(name) && Object.keys(config.jsxComponents.include).includes(name) && config.jsxComponents.include[name].attributes.includes(attribute);
}
function isJsxComponentChildrenIncluded({
  name,
  config
}) {
  return !config.jsxComponents.exclude.includes(name) && (Object.keys(config.jsxComponents.include).includes(name) && config.jsxComponents.include[name].children || !Object.keys(config.jsxComponents.include).includes(name) && config.jsxComponents.default);
}
function isJsonOrYamlPropertyIncluded({
  property,
  config
}) {
  return !config.jsonOrYamlProperties.exclude.includes(property) && config.jsonOrYamlProperties.include.includes(property);
}
export {
  HTML_ELEMENTS_CONFIG,
  HTML_TAGS,
  isFrontmatterFieldIncluded,
  isHtmlElementAttributeIncluded,
  isHtmlElementChildrenIncluded,
  isHtmlElementIncluded,
  isHtmlTag,
  isJsonOrYamlPropertyIncluded,
  isJsxComponentAttributeIncluded,
  isJsxComponentChildrenIncluded,
  isJsxComponentIncluded,
  isMarkdownNodeIncluded,
  resolveConfig
};
