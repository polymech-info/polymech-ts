// src/markdown-blessed.ts

import * as blessed from 'blessed'
import { marked, Tokens } from 'marked'
/**
 * Define a custom renderer where the `image` method
 * uses Marked's new signature: image({ href, title, text }: Tokens.Image).
 */
const customRenderer = {
  image({ href, title, text }: Tokens.Image): string {
    // Provide a textual placeholder instead of an actual image
    return `\n[IMAGE: ${text || 'No Alt'}](${href || 'No Href'})\n`;
  },
  // (Optional) you can override other renderer methods here
};

// We tell Marked to use our custom renderer
// Alternatively, you can pass { renderer: customRenderer } directly to marked().
marked.use({ renderer: customRenderer });

/**
 * Renders the given Markdown string in a Blessed terminal UI.
 *
 * @param markdownContent - The Markdown content to display.
 */
export function displayMarkdown(markdownContent: string): void {
  // 1) Create Blessed screen
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Markdown Example with Blessed'
  });

  // 2) Create a scrollable box for the text
  const box = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '100%',
    height: '100%',
    keys: true,
    vi: true,
    mouse: true,
    border: 'none',
    alwaysScroll: true,
    scrollable: true
  });

  // 3) Parse the markdown into a string using our renderer
  const parsedContent = marked(markdownContent);

  // 4) Set the box content
  box.setContent(parsedContent);

  // 5) Focus and render
  box.focus();
  screen.render();

}
