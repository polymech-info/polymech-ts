import { unNodeIsParent } from "./unist.js";
const NEXT = true;
const STOP = false;
function unwalk(node, visit, filter) {
  let next = true;
  function step(node2, parent, index) {
    if (filter && !filter(node2, parent)) return;
    if (unNodeIsParent(node2)) {
      for (let i = 0; i < node2.children.length; i++) {
        if (!next) break;
        const child = node2.children[i];
        step(child, node2, i);
      }
      node2.children = node2.children.filter((child) => child);
    }
    if (!next) return;
    const signal = visit(node2, parent, index);
    next = signal === void 0 || NEXT ? NEXT : STOP;
  }
  step(node, void 0, void 0);
}
export {
  unwalk
};
