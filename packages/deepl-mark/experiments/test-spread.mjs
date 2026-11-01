import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';

const md = `* Mode: Selects the algorithm:
  * 0 - All: Cycles through all devices.
  * 1 - SP: Cycles through devices in groups.
* Post-Mode: blah`;

const tree = fromMarkdown(md);
const list = tree.children[0];

console.log('=== AST Analysis ===');
console.log('list spread:', list.spread);
for (const [i, item] of list.children.entries()) {
    console.log(`item[${i}] spread:`, item.spread, 'children count:', item.children.length, 'children types:', item.children.map(c => c.type));
}

console.log('\n=== Default toMarkdown ===');
console.log(JSON.stringify(toMarkdown(tree)));

console.log('\n=== With join rule ===');
const result = toMarkdown(tree, {
    listItemIndent: 'one',
    join: [
        (__, _, parent) => {
            if (parent?.type === 'list') return 0;
            if (parent?.type === 'listItem') return 0;
            return 1;
        }
    ]
});
console.log(JSON.stringify(result));

console.log('\n=== With join rule + forced spread=false ===');
function clearSpread(node) {
    if (node.spread !== undefined) node.spread = false;
    if (node.children) node.children.forEach(clearSpread);
}
clearSpread(tree);
const result2 = toMarkdown(tree, {
    listItemIndent: 'one',
    join: [
        (__, _, parent) => {
            if (parent?.type === 'list') return 0;
            if (parent?.type === 'listItem') return 0;
            return 1;
        }
    ]
});
console.log(JSON.stringify(result2));
