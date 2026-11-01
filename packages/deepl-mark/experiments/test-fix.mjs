import prettier from 'prettier';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';

const md = `The panel includes the following settings:

* ON/OFF Toggle: A main switch.
* Min Heating Time (1-60s): Minimum duration.
* Mode: Selects the sequential heating algorithm:
  * 0 - All: Cycles through all devices with time-based control.
  * 1 - SP: Cycles through devices in groups.
  * 2 - SP Any: Heats any devices that need heating.
* Post-Heatup Mode: Mode to switch to after initial heatup phase.
* Current Status: Display field showing the current state.`;

const prettified = await prettier.format(md, {
    parser: 'mdx',
    printWidth: Infinity,
    proseWrap: 'never',
    useTabs: true
});

const tree = fromMarkdown(prettified);

// FIX: also handle listItem parent in the join rule
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

console.log('=== FIXED output ===');
console.log(result);
