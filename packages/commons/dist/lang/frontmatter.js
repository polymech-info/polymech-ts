import yaml from 'js-yaml';
export function isFrontmatterValid(frontmatter) {
    try {
        // ensure frontmatter is JSON-serializable
        JSON.stringify(frontmatter);
    }
    catch {
        return false;
    }
    return typeof frontmatter === 'object' && frontmatter !== null;
}
// Capture frontmatter wrapped with `---`, including any characters and new lines within it.
// Only capture if `---` exists near the top of the file, including:
// 1. Start of file (including if has BOM encoding)
// 2. Start of file with any whitespace (but `---` must still start on a new line)
const frontmatterRE = /(?:^\uFEFF?|^\s*\n)---([\s\S]*?\n)---/;
export function extractFrontmatter(code) {
    return frontmatterRE.exec(code)?.[1];
}
export function parseFrontmatter(code, options) {
    const rawFrontmatter = extractFrontmatter(code);
    if (rawFrontmatter == null) {
        return { frontmatter: {}, rawFrontmatter: '', content: code };
    }
    const parsed = yaml.load(rawFrontmatter);
    const frontmatter = (parsed && typeof parsed === 'object' ? parsed : {});
    let content;
    switch (options?.frontmatter ?? 'remove') {
        case 'preserve':
            content = code;
            break;
        case 'remove':
            content = code.replace(`---${rawFrontmatter}---`, '');
            break;
        case 'empty-with-spaces':
            content = code.replace(`---${rawFrontmatter}---`, `   ${rawFrontmatter.replace(/[^\r\n]/g, ' ')}   `);
            break;
        case 'empty-with-lines':
            content = code.replace(`---${rawFrontmatter}---`, rawFrontmatter.replace(/[^\r\n]/g, ''));
            break;
    }
    return {
        frontmatter,
        rawFrontmatter,
        content,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRtYXR0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGFuZy9mcm9udG1hdHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLElBQUksTUFBTSxTQUFTLENBQUM7QUFFM0IsTUFBTSxVQUFVLGtCQUFrQixDQUFDLFdBQWdDO0lBQ2xFLElBQUksQ0FBQztRQUNKLDBDQUEwQztRQUMxQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFBQyxNQUFNLENBQUM7UUFDUixPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFDRCxPQUFPLE9BQU8sV0FBVyxLQUFLLFFBQVEsSUFBSSxXQUFXLEtBQUssSUFBSSxDQUFDO0FBQ2hFLENBQUM7QUFFRCw0RkFBNEY7QUFDNUYsb0VBQW9FO0FBQ3BFLG1EQUFtRDtBQUNuRCxrRkFBa0Y7QUFDbEYsTUFBTSxhQUFhLEdBQUcsdUNBQXVDLENBQUM7QUFDOUQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLElBQVk7SUFDOUMsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQXFCRCxNQUFNLFVBQVUsZ0JBQWdCLENBQy9CLElBQVksRUFDWixPQUFpQztJQUVqQyxNQUFNLGNBQWMsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVoRCxJQUFJLGNBQWMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUM1QixPQUFPLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxjQUFjLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUMvRCxDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUN6QyxNQUFNLFdBQVcsR0FBRyxDQUFDLE1BQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUF3QixDQUFDO0lBRWhHLElBQUksT0FBZSxDQUFDO0lBQ3BCLFFBQVEsT0FBTyxFQUFFLFdBQVcsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUMxQyxLQUFLLFVBQVU7WUFDZCxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2YsTUFBTTtRQUNQLEtBQUssUUFBUTtZQUNaLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sY0FBYyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEQsTUFBTTtRQUNQLEtBQUssbUJBQW1CO1lBQ3ZCLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUNyQixNQUFNLGNBQWMsS0FBSyxFQUN6QixNQUFNLGNBQWMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQ2xELENBQUM7WUFDRixNQUFNO1FBQ1AsS0FBSyxrQkFBa0I7WUFDdEIsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxjQUFjLEtBQUssRUFBRSxjQUFjLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFGLE1BQU07SUFDUixDQUFDO0lBRUQsT0FBTztRQUNOLFdBQVc7UUFDWCxjQUFjO1FBQ2QsT0FBTztLQUNQLENBQUM7QUFDSCxDQUFDIn0=