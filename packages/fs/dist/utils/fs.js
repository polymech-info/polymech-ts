import * as fs from 'fs';
import { promisify } from '../promisify.js';
const isCallbackMethod = (key) => {
    return [
        typeof fs[key] === 'function',
        !key.match(/Sync$/),
        !key.match(/^[A-Z]/),
        !key.match(/^create/),
        !key.match(/^(un)?watch/),
    ].every(Boolean);
};
const adaptMethod = (name) => {
    const original = fs[name];
    return promisify(original);
};
const adaptAllMethods = () => {
    const adapted = {};
    Object.keys(fs).forEach((key) => {
        if (isCallbackMethod(key)) {
            if (key === 'exists') {
                // fs.exists() does not follow standard
                // Node callback conventions, and has
                // no error object in the callback
                adapted['exists'] = () => {
                    throw new Error('fs.exists() is deprecated');
                };
            }
            else {
                adapted[key] = adaptMethod(key);
            }
        }
        else {
            adapted[key] = fs[key];
        }
    });
    return adapted;
};
module.exports = adaptAllMethods();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvZnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBRTNDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUMvQixPQUFPO1FBQ0wsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssVUFBVTtRQUM3QixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQ25CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDcEIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUNyQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO0tBQzFCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQztBQUVGLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7SUFDM0IsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFCLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQztBQUVGLE1BQU0sZUFBZSxHQUFHLEdBQUcsRUFBRTtJQUMzQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUM5QixJQUFJLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUIsSUFBSSxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3JCLHVDQUF1QztnQkFDdkMscUNBQXFDO2dCQUNyQyxrQ0FBa0M7Z0JBQ2xDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLEVBQUU7b0JBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztnQkFDL0MsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QixDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDLENBQUM7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLGVBQWUsRUFBRSxDQUFDIn0=