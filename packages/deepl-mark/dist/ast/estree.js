function esNodeIs(node, type) {
  return node ? node.type === type : false;
}
function resolveEstreePropertyPath(node, parents, attributeName) {
  if (!esNodeIs(parents[2], "ArrayExpression") && !esNodeIs(parents[2], "ObjectExpression")) return;
  if (!esNodeIs(node.key, "Identifier")) return;
  const names = [node.key.name];
  for (let i = parents.length - 1; i > 1; i--) {
    const parent = parents[i];
    if (esNodeIs(parent, "ArrayExpression") || esNodeIs(parent, "ObjectExpression")) continue;
    if (esNodeIs(parent, "Property")) {
      if (!esNodeIs(parent.key, "Identifier")) return;
      names.push(parent.key.name);
      continue;
    }
    return;
  }
  names.push(attributeName);
  return names.reverse().join(".");
}
export {
  esNodeIs,
  resolveEstreePropertyPath
};
