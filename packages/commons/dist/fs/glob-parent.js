import { posix } from 'path';
import { platform } from 'os';
import { hasMagic } from 'glob';
const isWin32 = platform() === 'win32';
const slash = '/';
const backslash = /\\/g;
const escaped = /\\([!*?|[\](){}])/g;
export const globParent = (str, opts) => {
    const options = { flipBackslashes: true, ...opts };
    // flip windows path separators
    if (options.flipBackslashes && isWin32 && !str.includes(slash)) {
        str = str.replace(backslash, slash);
    }
    // special case for strings ending in enclosure containing path separator
    if (isEnclosure(str)) {
        str += slash;
    }
    // preserves full path in case of trailing path separator
    str += 'a';
    // remove path parts that are globby
    do {
        str = posix.dirname(str);
    } while (isGlobby(str));
    // remove escape chars and return result
    return str.replace(escaped, '$1');
};
function isEnclosure(str) {
    const lastChar = str.slice(-1);
    let enclosureStart;
    switch (lastChar) {
        case '}':
            enclosureStart = '{';
            break;
        case ']':
            enclosureStart = '[';
            break;
        default:
            return false;
    }
    const foundIndex = str.indexOf(enclosureStart);
    if (foundIndex < 0) {
        return false;
    }
    return str.slice(foundIndex + 1, -1).includes(slash);
}
function isGlobby(str) {
    if (/\([^()]+$/.test(str)) {
        return true;
    }
    if (str[0] === '{' || str[0] === '[') {
        return true;
    }
    if (/[^\\][{[]/.test(str)) {
        return true;
    }
    return hasMagic(str);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYi1wYXJlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnMvZ2xvYi1wYXJlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLE1BQU0sQ0FBQTtBQUM1QixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBQzdCLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxNQUFNLENBQUE7QUFFL0IsTUFBTSxPQUFPLEdBQUcsUUFBUSxFQUFFLEtBQUssT0FBTyxDQUFBO0FBRXRDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNsQixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDeEIsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUM7QUFNckMsTUFBTSxDQUFDLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBVyxFQUFFLElBQWMsRUFBVSxFQUFFO0lBQ2hFLE1BQU0sT0FBTyxHQUFZLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDO0lBRTVELCtCQUErQjtJQUMvQixJQUFJLE9BQU8sQ0FBQyxlQUFlLElBQUksT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQy9ELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQseUVBQXlFO0lBQ3pFLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDckIsR0FBRyxJQUFJLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCx5REFBeUQ7SUFDekQsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUVYLG9DQUFvQztJQUNwQyxHQUFHLENBQUM7UUFDRixHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDLFFBQVEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBRXhCLHdDQUF3QztJQUN4QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQTtBQUVELFNBQVMsV0FBVyxDQUFDLEdBQVc7SUFDOUIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRS9CLElBQUksY0FBc0IsQ0FBQztJQUMzQixRQUFRLFFBQVEsRUFBRSxDQUFDO1FBQ2pCLEtBQUssR0FBRztZQUNOLGNBQWMsR0FBRyxHQUFHLENBQUM7WUFDckIsTUFBTTtRQUNSLEtBQUssR0FBRztZQUNOLGNBQWMsR0FBRyxHQUFHLENBQUM7WUFDckIsTUFBTTtRQUNSO1lBQ0UsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDL0MsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDbkIsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkQsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLEdBQVc7SUFDM0IsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDMUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0QsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNyQyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUMxQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2QixDQUFDIn0=