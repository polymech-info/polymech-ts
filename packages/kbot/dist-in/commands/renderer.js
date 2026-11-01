// src/markdown-blessed.ts
import * as blessed from 'blessed';
import { marked } from 'marked';
/**
 * Define a custom renderer where the `image` method
 * uses Marked's new signature: image({ href, title, text }: Tokens.Image).
 */
const customRenderer = {
    image({ href, title, text }) {
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
export function displayMarkdown(markdownContent) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEJBQTBCO0FBRTFCLE9BQU8sS0FBSyxPQUFPLE1BQU0sU0FBUyxDQUFBO0FBQ2xDLE9BQU8sRUFBRSxNQUFNLEVBQVUsTUFBTSxRQUFRLENBQUE7QUFDdkM7OztHQUdHO0FBQ0gsTUFBTSxjQUFjLEdBQUc7SUFDckIsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQWdCO1FBQ3ZDLDJEQUEyRDtRQUMzRCxPQUFPLGFBQWEsSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksU0FBUyxLQUFLLENBQUM7SUFDbEUsQ0FBQztJQUNELDBEQUEwRDtDQUMzRCxDQUFDO0FBRUYsNENBQTRDO0FBQzVDLGlGQUFpRjtBQUNqRixNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7QUFFekM7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsZUFBdUI7SUFDckQsMkJBQTJCO0lBQzNCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDNUIsUUFBUSxFQUFFLElBQUk7UUFDZCxLQUFLLEVBQUUsK0JBQStCO0tBQ3ZDLENBQUMsQ0FBQztJQUVILDBDQUEwQztJQUMxQyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3RCLE1BQU0sRUFBRSxNQUFNO1FBQ2QsR0FBRyxFQUFFLFFBQVE7UUFDYixJQUFJLEVBQUUsUUFBUTtRQUNkLEtBQUssRUFBRSxNQUFNO1FBQ2IsTUFBTSxFQUFFLE1BQU07UUFDZCxJQUFJLEVBQUUsSUFBSTtRQUNWLEVBQUUsRUFBRSxJQUFJO1FBQ1IsS0FBSyxFQUFFLElBQUk7UUFDWCxNQUFNLEVBQUUsTUFBTTtRQUNkLFlBQVksRUFBRSxJQUFJO1FBQ2xCLFVBQVUsRUFBRSxJQUFJO0tBQ2pCLENBQUMsQ0FBQztJQUVILHlEQUF5RDtJQUN6RCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7SUFFOUMseUJBQXlCO0lBQ3pCLEdBQUcsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFOUIsc0JBQXNCO0lBQ3RCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNaLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUVsQixDQUFDIn0=