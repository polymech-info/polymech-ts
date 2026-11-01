/**
 * A simple function to checker whether a target mime type matches a mime-type
 * pattern (e.g. image/jpeg matches image/jpeg OR image/*).
 *
 * @export
 * @param {string} target
 * @param {string} pattern
 * @returns
 */
export default function (target: string, pattern: string): boolean | ((_pattern: any) => boolean);
