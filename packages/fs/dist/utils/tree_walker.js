import { Readable } from 'node:stream';
import * as pathUtil from 'node:path';
import { sync as inspectSync, async as inspectASync } from '../inspect.js';
import { ENodeType } from '../interfaces.js';
import { sync as listSync, async as listASync } from '../list.js';
// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------
export function sync(path, options, callback, currentLevel) {
    const item = inspectSync(path, options.inspectOptions);
    if (options.maxLevelsDeep === undefined) {
        options.maxLevelsDeep = Infinity;
    }
    if (currentLevel === undefined) {
        currentLevel = 0;
    }
    let children = [];
    const hasChildren = item && item.type === ENodeType.DIR && currentLevel < options.maxLevelsDeep;
    if (hasChildren) {
        children = listSync(path);
    }
    callback(path, item);
    if (hasChildren) {
        children.forEach(child => sync(path + pathUtil.sep + child, options, callback, currentLevel + 1));
    }
}
export function stream(path, options) {
    const rs = new Readable({ objectMode: true });
    let nextTreeNode = {
        path: path,
        parent: undefined,
        level: 0
    };
    let running = false;
    let readSome;
    const error = (err) => {
        rs.emit('error', err);
    };
    const findNextUnprocessedNode = (node) => {
        if (node.nextSibling) {
            return node.nextSibling;
        }
        else if (node.parent) {
            return findNextUnprocessedNode(node.parent);
        }
        return undefined;
    };
    const pushAndContinueMaybe = (data) => {
        const theyWantMore = rs.push(data);
        running = false;
        if (!nextTreeNode) {
            // Previous was the last node. The job is done.
            rs.push(null);
        }
        else if (theyWantMore) {
            readSome();
        }
    };
    if (options.maxLevelsDeep === undefined) {
        options.maxLevelsDeep = Infinity;
    }
    readSome = () => {
        const theNode = nextTreeNode;
        running = true;
        inspectASync(theNode.path, options.inspectOptions)
            .then((inspected) => {
            theNode.inspected = inspected;
            if (inspected && inspected.type === ENodeType.DIR && theNode.level < options.maxLevelsDeep) {
                listASync(theNode.path)
                    .then((childrenNames) => {
                    const children = childrenNames.map((name) => {
                        return {
                            name: name,
                            path: theNode.path + pathUtil.sep + name,
                            parent: theNode,
                            level: theNode.level + 1
                        };
                    });
                    children.forEach((child, index) => {
                        child.nextSibling = children[index + 1];
                    });
                    nextTreeNode = children[0] || findNextUnprocessedNode(theNode);
                    pushAndContinueMaybe({ path: theNode.path, item: inspected });
                })
                    .catch(error);
            }
            else {
                nextTreeNode = findNextUnprocessedNode(theNode);
                pushAndContinueMaybe({ path: theNode.path, item: inspected });
            }
        })
            .catch(error);
    };
    rs['_read'] = () => {
        if (!running) {
            readSome();
        }
    };
    return rs;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZV93YWxrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvdHJlZV93YWxrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUN2QyxPQUFPLEtBQU0sUUFBUSxNQUFNLFdBQVcsQ0FBQztBQUN2QyxPQUFPLEVBQUUsSUFBSSxJQUFJLFdBQVcsRUFBRSxLQUFLLElBQUksWUFBWSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzNFLE9BQU8sRUFBRSxTQUFTLEVBQTBCLE1BQU0sa0JBQWtCLENBQUM7QUFDckUsT0FBTyxFQUFFLElBQUksSUFBSSxRQUFRLEVBQUUsS0FBSyxJQUFJLFNBQVMsRUFBRSxNQUFNLFlBQVksQ0FBQztBQU9sRSw0REFBNEQ7QUFDNUQsT0FBTztBQUNQLDREQUE0RDtBQUM1RCxNQUFNLFVBQVUsSUFBSSxDQUFDLElBQVksRUFBRSxPQUFpQixFQUFFLFFBQTZDLEVBQUUsWUFBcUI7SUFDekgsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDdkQsSUFBSSxPQUFPLENBQUMsYUFBYSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3pDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDO0lBQ2xDLENBQUM7SUFDRCxJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUNoQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxJQUFJLFFBQVEsR0FBYSxFQUFFLENBQUM7SUFDNUIsTUFBTSxXQUFXLEdBQVksSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEdBQUcsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUN6RyxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2pCLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUNELFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDckIsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNqQixRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25HLENBQUM7QUFDRixDQUFDO0FBYUQsTUFBTSxVQUFVLE1BQU0sQ0FBQyxJQUFZLEVBQUUsT0FBaUI7SUFDckQsTUFBTSxFQUFFLEdBQUcsSUFBSSxRQUFRLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM5QyxJQUFJLFlBQVksR0FBaUI7UUFDaEMsSUFBSSxFQUFFLElBQUk7UUFDVixNQUFNLEVBQUUsU0FBUztRQUNqQixLQUFLLEVBQUUsQ0FBQztLQUNSLENBQUM7SUFDRixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDcEIsSUFBSSxRQUFhLENBQUM7SUFDbEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFVLEVBQUUsRUFBRTtRQUM1QixFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN2QixDQUFDLENBQUM7SUFDRixNQUFNLHVCQUF1QixHQUFHLENBQUMsSUFBa0IsRUFBZ0IsRUFBRTtRQUNwRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN0QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3hCLE9BQU8sdUJBQXVCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDLENBQUM7SUFFRixNQUFNLG9CQUFvQixHQUFHLENBQUMsSUFBbUMsRUFBRSxFQUFFO1FBQ3BFLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNoQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbkIsK0NBQStDO1lBQy9DLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDZixDQUFDO2FBQU0sSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUN6QixRQUFRLEVBQUUsQ0FBQztRQUNaLENBQUM7SUFDRixDQUFDLENBQUM7SUFFRixJQUFJLE9BQU8sQ0FBQyxhQUFhLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDekMsT0FBTyxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7SUFDbEMsQ0FBQztJQUVELFFBQVEsR0FBRyxHQUFTLEVBQUU7UUFDckIsTUFBTSxPQUFPLEdBQWlCLFlBQVksQ0FBQztRQUMzQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQzthQUNoRCxJQUFJLENBQUMsQ0FBQyxTQUFnQixFQUFFLEVBQUU7WUFDMUIsT0FBTyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDOUIsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUM1RixTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztxQkFDckIsSUFBSSxDQUFDLENBQUMsYUFBdUIsRUFBRSxFQUFFO29CQUNqQyxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7d0JBQzNDLE9BQU87NEJBQ04sSUFBSSxFQUFFLElBQUk7NEJBQ1YsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLEdBQUcsR0FBRyxJQUFJOzRCQUN4QyxNQUFNLEVBQUUsT0FBTzs0QkFDZixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDO3lCQUN4QixDQUFDO29CQUNILENBQUMsQ0FBQyxDQUFDO29CQUNILFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFtQixFQUFFLEtBQWEsRUFBRSxFQUFFO3dCQUN2RCxLQUFLLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3pDLENBQUMsQ0FBQyxDQUFDO29CQUVILFlBQVksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQy9ELG9CQUFvQixDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQy9ELENBQUMsQ0FBQztxQkFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFlBQVksR0FBRyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDaEQsb0JBQW9CLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUMvRCxDQUFDO1FBQ0YsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hCLENBQUMsQ0FBQztJQUNGLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLEVBQUU7UUFDbEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2QsUUFBUSxFQUFFLENBQUM7UUFDWixDQUFDO0lBQ0YsQ0FBQyxDQUFDO0lBQ0YsT0FBTyxFQUFFLENBQUM7QUFDWCxDQUFDIn0=