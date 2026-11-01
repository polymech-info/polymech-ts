import { isRegExp } from "node:util/types";
import { esNodeIs } from "./estree.js";
const DEFAULT_ESWALKERS = {
  Program(node, parents, process) {
    parents.push(node);
    for (const statement of node.body) {
      process(statement, parents);
    }
    parents.pop();
  },
  ExpressionStatement(node, parents, process) {
    parents.push(node);
    process(node.expression, parents);
    parents.pop();
  },
  ArrayExpression(node, parents, process) {
    parents.push(node);
    for (const element of node.elements) {
      process(element, parents);
    }
    parents.pop();
  },
  ObjectExpression(node, parents, process) {
    parents.push(node);
    for (const property of node.properties) {
      process(property, parents);
    }
    parents.pop();
  },
  Property(node, parents, process) {
    parents.push(node);
    process(node.key, parents);
    process(node.value, parents);
    parents.pop();
  },
  JSXElement(node, parents, process) {
    parents.push(node);
    for (const child of node.children) {
      process(child, parents);
    }
    for (const attribute of node.openingElement.attributes) {
      process(attribute, parents);
    }
    parents.pop();
  },
  JSXAttribute(node, parents, process) {
    parents.push(node);
    if (node.value) {
      process(node.value, parents);
    }
    parents.pop();
  }
};
function eswalk(ast, visitors, walkers = DEFAULT_ESWALKERS) {
  const process = (node, parents) => {
    if (!node) return;
    let type = node.type;
    if (esNodeIs(node, "Literal")) {
      type = typeof node.value === "bigint" ? "BigIntLiteral" : isRegExp(node.value) ? "RegExpLiteral" : "SimpleLiteral";
    }
    const visit = visitors[type];
    const walk = walkers[type];
    let keepWalking = true;
    if (visit !== void 0) {
      const signal = visit(node, parents);
      keepWalking = signal === false ? false : true;
    }
    if (keepWalking && walk) walk(node, parents, process);
  };
  process(ast, []);
}
export {
  DEFAULT_ESWALKERS,
  eswalk
};
