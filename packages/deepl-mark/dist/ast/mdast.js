import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown, frontmatterToMarkdown } from "mdast-util-frontmatter";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import { htmlCommentFromMarkdown, htmlCommentToMarkdown } from "../vendor/mdast-util-html-comment.js";
import { mdxFromMarkdown, mdxToMarkdown } from "mdast-util-mdx";
import { toMarkdown } from "mdast-util-to-markdown";
import { frontmatter } from "micromark-extension-frontmatter";
import { gfmTable } from "micromark-extension-gfm-table";
import { htmlComment } from "../vendor/micromark-extension-html-comment.js";
import { mdxjs } from "micromark-extension-mdxjs";
function mdNodeIs(node, type) {
  return node ? node.type === type : false;
}
function mdNodeIsJsxElement(node) {
  return mdNodeIs(node, "mdxJsxFlowElement") || mdNodeIs(node, "mdxJsxTextElement");
}
function getMdast(markdown) {
  return fromMarkdown(markdown, {
    extensions: [frontmatter("yaml"), mdxjs(), gfmTable, htmlComment()],
    mdastExtensions: [frontmatterFromMarkdown("yaml"), mdxFromMarkdown(), gfmTableFromMarkdown, htmlCommentFromMarkdown()]
  });
}
function getMarkdown(mdast) {
  return toMarkdown(mdast, {
    extensions: [frontmatterToMarkdown("yaml"), mdxToMarkdown(), gfmTableToMarkdown(), htmlCommentToMarkdown()],
    listItemIndent: "one",
    join: [
      (__, _, parent) => {
        if (mdNodeIsJsxElement(parent)) {
          return 0;
        }
        if (mdNodeIs(parent, "list")) {
          return 0;
        }
        if (mdNodeIs(parent, "listItem")) {
          return 0;
        }
        return 1;
      }
    ]
  });
}
export {
  getMarkdown,
  getMdast,
  mdNodeIs,
  mdNodeIsJsxElement
};
