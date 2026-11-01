import prettier from "prettier";
import { getMarkdown, getMdast, mdNodeIs } from "./ast/mdast.js";
import { unwalk } from "./ast/unwalk.js";
async function format(markdown) {
  const mdast = getMdast(
    await prettier.format(markdown, {
      parser: "mdx",
      printWidth: Infinity,
      proseWrap: "never",
      useTabs: true
    })
  );
  unwalk(
    mdast,
    (node, parent, index) => {
      if (mdNodeIs(node, "mdxFlowExpression") && expressionIsEmpty(node.value)) {
        parent.children[index] = void 0;
      }
    },
    (node, parent) => {
      delete node.position;
      return mdNodeIs(parent, "root");
    }
  );
  return getMarkdown(mdast);
}
function expressionIsEmpty(text) {
  const regex = /^('|")\s*('|")$/;
  return regex.test(text);
}
export {
  format
};
