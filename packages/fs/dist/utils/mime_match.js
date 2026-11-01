import { default as wildcard } from './wildcard.js';
const reMimePartSplit = /[/+.]/;
/**
 * A simple function to checker whether a target mime type matches a mime-type
 * pattern (e.g. image/jpeg matches image/jpeg OR image/*).
 *
 * @export
 * @param {string} target
 * @param {string} pattern
 * @returns
 */
export default function (target, pattern) {
    const test = (_pattern) => {
        const result = wildcard(_pattern, target, reMimePartSplit);
        // ensure that we have a valid mime type (should have two parts)
        return result && result.length >= 2;
    };
    return pattern ? test(pattern.split(';')[0]) : test;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWltZV9tYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9taW1lX21hdGNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxPQUFPLElBQUksUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3BELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQztBQUNoQzs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sQ0FBQyxPQUFPLFdBQVcsTUFBYyxFQUFFLE9BQWU7SUFDdkQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRTtRQUN6QixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQztRQUMzRCxnRUFBZ0U7UUFDaEUsT0FBTyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQyxDQUFDO0lBQ0YsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNyRCxDQUFDIn0=