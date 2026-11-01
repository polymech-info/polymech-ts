import { sync as read } from '@polymech/fs/read';
import { sync as exists } from '@polymech/fs/exists';
import { resolve } from '@polymech/commons';
import * as path from 'node:path';
import { resolveQuery } from './utils/input.js';
import { env_vars } from './utils/env.js';
import { PREFERENCES_FILE_NAME } from './constants.js';
export const prompt = async (opts) => {
    const input = await resolveQuery(opts);
    return {
        role: "user",
        content: input || ''
    };
};
export const preferences = async (opts) => {
    // First try local preferences
    let preferencesPath = path.resolve(path.join(process.cwd(), PREFERENCES_FILE_NAME));
    if (!exists(preferencesPath)) {
        // Fall back to specified preferences path if local file doesn't exist
        // Only resolve if opts.preferences is actually defined
        preferencesPath = opts.preferences ? path.resolve(resolve(opts.preferences, false, env_vars())) : '';
    }
    // Only read if preferencesPath is valid and exists
    const preferencesContent = preferencesPath && exists(preferencesPath) ? read(preferencesPath, 'string') : '';
    return {
        role: "user",
        // Only include content if preferences were actually loaded
        content: preferencesContent ? `USER Preferences : ${preferencesContent}` : ''
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Byb21wdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDcEQsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzNDLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBRWpDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUMvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFDekMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFdEQsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxJQUFlLEVBQW1ELEVBQUU7SUFDN0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDdEMsT0FBTztRQUNILElBQUksRUFBRSxNQUFNO1FBQ1osT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFO0tBQ3ZCLENBQUE7QUFDTCxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsS0FBSyxFQUFFLElBQWUsRUFBbUQsRUFBRTtJQUNsRyw4QkFBOEI7SUFDOUIsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUE7SUFDbkYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1FBQzNCLHNFQUFzRTtRQUN0RSx1REFBdUQ7UUFDdkQsZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBQ3hHLENBQUM7SUFDRCxtREFBbUQ7SUFDbkQsTUFBTSxrQkFBa0IsR0FBRyxlQUFlLElBQUksTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7SUFDdEgsT0FBTztRQUNILElBQUksRUFBRSxNQUFNO1FBQ1osMkRBQTJEO1FBQzNELE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7S0FDaEYsQ0FBQTtBQUNMLENBQUMsQ0FBQSJ9