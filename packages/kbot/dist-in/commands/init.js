import * as path from 'node:path';
import { Logger } from 'tslog';
import { sync as dir } from '@polymech/fs/dir';
import { sync as exists } from '@polymech/fs/exists';
import { sync as write } from '@polymech/fs/write';
import { MODULE_NAME } from '../constants.js';
const PREFERENCES_TEMPLATE = `# Personal Preferences

This file stores personal information and preferences to help the AI assistant provide more personalized and contextual responses.

## My Preferences

Gender : 
Location : 
Language : 
Occupation : 
Age : 

## Contacts

My email address : 
My wife's email address : 
My second wife's email address : 

## Content

When creating content

- always Markdown
- always add links to sources
- when searching for news, always add links to videos
`;
const CONFIG_TEMPLATE = {
    "deepl": {
        "auth_key": "YOUR_DEEPL_AUTH_KEY",
        "free_api": false
    },
    "scaleserp": {
        "key": "YOUR_SCALE_SERP_KEY"
    },
    "geocoder": {
        "key": "YOUR_GEOCODER_KEY"
    },
    "serpapi": {
        "key": "YOUR_SERPAPI_KEY"
    },
    "openai": {
        "key": "YOUR_OPENAI_KEY"
    },
    "bigdata": {
        "key": "YOUR_BIGDATA_KEY"
    },
    "novita": {
        "key": "YOUR_NOVITA_KEY"
    },
    "perplexity": {
        "key": "YOUR_PERPLEXITY_KEY"
    },
    "gemini": {
        "key": "YOUR_GEMINI_KEY"
    },
    "openrouter": {
        "key": "YOUR_OPENROUTER_KEY"
    },
    "deepseek": {
        "key": "YOUR_DEEPSEEK_KEY"
    },
    "google": {
        "cse": "YOUR_GOOGLE_CSE",
        "api_key": "YOUR_GOOGLE_API_KEY"
    }
};
export const init = async (argv) => {
    const logger = new Logger({
        hideLogPositionForProduction: true,
        maskPlaceholder: '***',
        name: MODULE_NAME,
        prettyLogTemplate: "{{logLevelName}}\t[{{filePathWithLine}}{{name}}]\t",
    });
    const kbotDir = path.resolve(path.join(process.cwd(), `.${MODULE_NAME}`));
    if (!exists(kbotDir)) {
        dir(kbotDir);
    }
    // Create preferences file if it doesn't exist
    const preferencesPath = path.resolve(kbotDir, 'preferences.md');
    if (!exists(preferencesPath)) {
        write(preferencesPath, PREFERENCES_TEMPLATE);
        logger.info(`📋 Created preferences file: ${preferencesPath}`);
    }
    else {
        logger.info(`📋 Preferences file already exists: ${preferencesPath}`);
    }
    // Create config file if it doesn't exist
    const configPath = path.resolve(kbotDir, 'config.json');
    if (!exists(configPath)) {
        write(configPath, CONFIG_TEMPLATE);
        logger.info(`📋 Created configuration file: ${configPath}`);
    }
    else {
        logger.info(`📋 Configuration file already exists: ${configPath}`);
    }
    logger.info('📋 Initialization complete!');
    return 0;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9pbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQ2pDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTyxPQUFPLENBQUE7QUFDL0IsT0FBTyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUM5QyxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDbEQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBRzdDLE1BQU0sb0JBQW9CLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5QjVCLENBQUE7QUFFRCxNQUFNLGVBQWUsR0FBRztJQUN0QixPQUFPLEVBQUU7UUFDUCxVQUFVLEVBQUUscUJBQXFCO1FBQ2pDLFVBQVUsRUFBRSxLQUFLO0tBQ2xCO0lBQ0QsV0FBVyxFQUFFO1FBQ1gsS0FBSyxFQUFFLHFCQUFxQjtLQUM3QjtJQUNELFVBQVUsRUFBRTtRQUNWLEtBQUssRUFBRSxtQkFBbUI7S0FDM0I7SUFDRCxTQUFTLEVBQUU7UUFDVCxLQUFLLEVBQUUsa0JBQWtCO0tBQzFCO0lBQ0QsUUFBUSxFQUFFO1FBQ1IsS0FBSyxFQUFFLGlCQUFpQjtLQUN6QjtJQUNELFNBQVMsRUFBRTtRQUNULEtBQUssRUFBRSxrQkFBa0I7S0FDMUI7SUFDRCxRQUFRLEVBQUU7UUFDUixLQUFLLEVBQUUsaUJBQWlCO0tBQ3pCO0lBQ0QsWUFBWSxFQUFFO1FBQ1osS0FBSyxFQUFFLHFCQUFxQjtLQUM3QjtJQUNELFFBQVEsRUFBRTtRQUNSLEtBQUssRUFBRSxpQkFBaUI7S0FDekI7SUFDRCxZQUFZLEVBQUU7UUFDWixLQUFLLEVBQUUscUJBQXFCO0tBQzdCO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsS0FBSyxFQUFFLG1CQUFtQjtLQUMzQjtJQUNELFFBQVEsRUFBRTtRQUNSLEtBQUssRUFBRSxpQkFBaUI7UUFDeEIsU0FBUyxFQUFFLHFCQUFxQjtLQUNqQztDQUNGLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLElBQWUsRUFBRSxFQUFFO0lBQzVDLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFVO1FBQ2pDLDRCQUE0QixFQUFFLElBQUk7UUFDbEMsZUFBZSxFQUFFLEtBQUs7UUFDdEIsSUFBSSxFQUFFLFdBQVc7UUFDakIsaUJBQWlCLEVBQUUsb0RBQW9EO0tBQ3hFLENBQUMsQ0FBQTtJQUNGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDekUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ3JCLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNkLENBQUM7SUFDRCw4Q0FBOEM7SUFDOUMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtJQUMvRCxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7UUFDN0IsS0FBSyxDQUFDLGVBQWUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFBO1FBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLGVBQWUsRUFBRSxDQUFDLENBQUE7SUFDaEUsQ0FBQztTQUFJLENBQUM7UUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLHVDQUF1QyxlQUFlLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZFLENBQUM7SUFFRCx5Q0FBeUM7SUFDekMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFDdkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQ3hCLEtBQUssQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLENBQUE7UUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsVUFBVSxFQUFFLENBQUMsQ0FBQTtJQUM3RCxDQUFDO1NBQUksQ0FBQztRQUNKLE1BQU0sQ0FBQyxJQUFJLENBQUMseUNBQXlDLFVBQVUsRUFBRSxDQUFDLENBQUE7SUFDcEUsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQTtJQUMxQyxPQUFPLENBQUMsQ0FBQTtBQUNWLENBQUMsQ0FBQSJ9