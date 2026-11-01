import { OSR_CACHE } from '@polymech/commons';
import { get_cached, set_cached } from '@polymech/cache';
import { sync as read } from "@polymech/fs/read";
import { sync as write } from "@polymech/fs/write";
import { MODULE_NAME } from '../constants.js';
import { translate } from '@polymech/deepl-mark';
import { update as updateGlossary } from './glossary.js';
import { logger } from './translate_commons.js';
export const translateMarkdown = async (src, dst, options) => {
    const osr_cache = OSR_CACHE();
    const cached = await get_cached(src, { keys: options.keys, filters: options.filters }, MODULE_NAME);
    if (osr_cache && cached && options.cache) {
        return cached;
    }
    const srcContent = read(src);
    // Fetch glossary if enabled
    let glossaryId;
    if (options.glossary !== false) {
        try {
            const glossary = await updateGlossary((options.srcLang || 'EN').toLowerCase(), (options.dstLang || 'DE').toLowerCase(), options);
            if (glossary && glossary.glossaryId) {
                glossaryId = glossary.glossaryId;
            }
        }
        catch (e) {
            logger.warn('Error updating glossary', e.message);
        }
    }
    try {
        const apiKey = options.config?.deepl?.auth_key || options.api_key;
        if (!apiKey) {
            throw new Error('DeepL API key is missing.');
        }
        const translations = await translate(srcContent, (options.srcLang || 'EN').toUpperCase(), (options.dstLang || 'DE').toUpperCase(), {
            apiKey,
            deeplOptions: {
                formality: options.formality && options.formality !== 'default' ? options.formality : undefined,
                glossary: glossaryId
            }
        });
        if (osr_cache && options.cache) {
            await set_cached(src, { keys: options.keys, filters: options.filters }, MODULE_NAME, translations);
        }
        if (translations) {
            write(dst, translations);
        }
        else {
            return false;
        }
        return translations;
    }
    catch (e) {
        logger.error(`Error translating markdown file ${src}`, e);
        return false;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlX21hcmtkb3duLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi90cmFuc2xhdGVfbWFya2Rvd24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzdDLE9BQU8sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDeEQsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsSUFBSSxJQUFJLEtBQUssRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBRWxELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUM3QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDaEQsT0FBTyxFQUFFLE1BQU0sSUFBSSxjQUFjLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFDeEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBRS9DLE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLEtBQUssRUFDbEMsR0FBVyxFQUNYLEdBQVcsRUFDWCxPQUFpQixFQUFFLEVBQUU7SUFFckIsTUFBTSxTQUFTLEdBQUcsU0FBUyxFQUFFLENBQUE7SUFDN0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxVQUFVLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNwRyxJQUFJLFNBQVMsSUFBSSxNQUFNLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZDLE9BQU8sTUFBTSxDQUFBO0lBQ2pCLENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFXLENBQUE7SUFFdEMsNEJBQTRCO0lBQzVCLElBQUksVUFBOEIsQ0FBQztJQUNuQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssS0FBSyxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFjLENBQ2pDLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFDdkMsQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUN2QyxPQUFPLENBQ1YsQ0FBQTtZQUNELElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbEMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUE7WUFDcEMsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDckQsQ0FBQztJQUNMLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUNsRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDVixNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELE1BQU0sWUFBWSxHQUFHLE1BQU0sU0FBUyxDQUFDLFVBQVUsRUFDM0MsQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBUyxFQUM5QyxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFTLEVBQzlDO1lBQ0ksTUFBTTtZQUNOLFlBQVksRUFBRTtnQkFDVixTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQWdCLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQ3RHLFFBQVEsRUFBRSxVQUFVO2FBQ3ZCO1NBQ0osQ0FDSixDQUFBO1FBRUQsSUFBSSxTQUFTLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzdCLE1BQU0sVUFBVSxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFBO1FBQ3RHLENBQUM7UUFFRCxJQUFJLFlBQVksRUFBRSxDQUFDO1lBQ2YsS0FBSyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQTtRQUM1QixDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sS0FBSyxDQUFBO1FBQ2hCLENBQUM7UUFDRCxPQUFPLFlBQVksQ0FBQTtJQUV2QixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE1BQU0sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3pELE9BQU8sS0FBSyxDQUFBO0lBQ2hCLENBQUM7QUFDTCxDQUFDLENBQUEifQ==