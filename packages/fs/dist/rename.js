import * as pathUtil from 'path';
import { sync as moveSync, async as moveASync } from './move.js';
import { validateArgument } from './utils/validate.js';
export function validateInput(methodName, path, newName) {
    const methodSignature = methodName + '(path, newName)';
    validateArgument(methodSignature, 'path', path, ['string']);
    validateArgument(methodSignature, 'newName', newName, ['string']);
}
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------
export function sync(path, newName) {
    moveSync(path, pathUtil.join(pathUtil.dirname(path), newName));
}
// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
export function async(path, newName) {
    return moveASync(path, pathUtil.join(pathUtil.dirname(path), newName));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuYW1lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlbmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssUUFBUSxNQUFNLE1BQU0sQ0FBQztBQUNqQyxPQUFPLEVBQUUsSUFBSSxJQUFJLFFBQVEsRUFBRSxLQUFLLElBQUksU0FBUyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ2pFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBRXZELE1BQU0sVUFBVSxhQUFhLENBQUMsVUFBa0IsRUFBRSxJQUFZLEVBQUUsT0FBZTtJQUM5RSxNQUFNLGVBQWUsR0FBRyxVQUFVLEdBQUcsaUJBQWlCLENBQUM7SUFDdkQsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzVELGdCQUFnQixDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUNuRSxDQUFDO0FBRUQsNERBQTREO0FBQzVELE9BQU87QUFDUCw0REFBNEQ7QUFDNUQsTUFBTSxVQUFVLElBQUksQ0FBQyxJQUFZLEVBQUUsT0FBZTtJQUNqRCxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFFRCw0REFBNEQ7QUFDNUQsUUFBUTtBQUNSLDREQUE0RDtBQUM1RCxNQUFNLFVBQVUsS0FBSyxDQUFDLElBQVksRUFBRSxPQUFlO0lBQ2xELE9BQU8sU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN4RSxDQUFDIn0=