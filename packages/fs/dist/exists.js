import { statSync, lstat } from 'fs';
import { validateArgument } from './utils/validate.js';
import { ENodeType } from './interfaces.js';
export function validateInput(methodName, path) {
    const methodSignature = methodName + '(path)';
    validateArgument(methodSignature, 'path', path, ['string']);
}
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
export function sync(path) {
    let stat;
    try {
        stat = statSync(path);
        if (stat.isDirectory()) {
            return 'dir';
        }
        else if (stat.isFile()) {
            return 'file';
        }
        return 'other';
    }
    catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') {
            throw err;
        }
    }
    return false;
}
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
export function async(path) {
    return new Promise((resolve, reject) => {
        lstat(path, (err, stat) => {
            if (err) {
                if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
                    resolve(false);
                }
                else {
                    reject(err);
                }
            }
            else if (stat.isDirectory()) {
                resolve(ENodeType.DIR);
            }
            else if (stat.isFile()) {
                resolve(ENodeType.FILE);
            }
            else {
                resolve(ENodeType.OTHER);
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhpc3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2V4aXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQVMsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQztBQUM1QyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUN2RCxPQUFPLEVBQUUsU0FBUyxFQUFrQixNQUFNLGlCQUFpQixDQUFDO0FBRTVELE1BQU0sVUFBVSxhQUFhLENBQUMsVUFBa0IsRUFBRSxJQUFZO0lBQzdELE1BQU0sZUFBZSxHQUFHLFVBQVUsR0FBRyxRQUFRLENBQUM7SUFDOUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCw0REFBNEQ7QUFDNUQsT0FBTztBQUNQLDREQUE0RDtBQUM1RCxNQUFNLFVBQVUsSUFBSSxDQUFDLElBQVk7SUFDaEMsSUFBSSxJQUFXLENBQUM7SUFDaEIsSUFBSSxDQUFDO1FBQ0osSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7WUFDMUIsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDckQsTUFBTSxHQUFHLENBQUM7UUFDWCxDQUFDO0lBQ0YsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2QsQ0FBQztBQUVELDREQUE0RDtBQUM1RCxRQUFRO0FBQ1IsNERBQTREO0FBQzVELE1BQU0sVUFBVSxLQUFLLENBQUMsSUFBWTtJQUNqQyxPQUFPLElBQUksT0FBTyxDQUFnQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBbUIsRUFBRSxJQUFXLEVBQUUsRUFBRTtZQUNoRCxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNULElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDckQsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoQixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEIsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUMxQixPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyJ9