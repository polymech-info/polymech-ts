import * as fs from 'fs';
import { toFile } from "openai";
import { sync as exists } from '@polymech/fs/exists';
import { createClient } from '../client.js';
const createBuffer = (path) => {
    try {
        const buffer = fs.readFileSync(path);
        return buffer;
    }
    catch (error) {
        console.error('Error creating buffer:', error);
        return null;
    }
};
export const transcribe = async (options) => {
    const client = createClient(options);
    if (!client) {
        options.logger.error('Failed to create client');
        return '';
    }
    if (!options.include || options.include.length === 0) {
        options.logger.error('No source file provided via --include');
        return '';
    }
    const sourceFile = options.include[0];
    if (!exists(sourceFile)) {
        options.logger.error('Source file does not exist', sourceFile);
        return '';
    }
    const file = await toFile(createBuffer(sourceFile), 'audio.mp3', { type: 'audio/mpeg' });
    if (!file) {
        options.logger.error('Error converting source to file');
        return '';
    }
    const completion = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: file,
        response_format: options.response_format || "verbose_json",
    });
    if (!completion) {
        options.logger.error('OpenAI response is empty');
        return '';
    }
    const text_content = completion.text || '';
    return text_content;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNjcmliZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvdHJhbnNjcmliZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQTtBQUN4QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sUUFBUSxDQUFBO0FBQy9CLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFHcEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGNBQWMsQ0FBQTtBQUUzQyxNQUFNLFlBQVksR0FBRyxDQUFDLElBQVksRUFBaUIsRUFBRTtJQUNqRCxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BDLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0FBQ0wsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sVUFBVSxHQUFHLEtBQUssRUFBRSxPQUFrQixFQUFtQixFQUFFO0lBQ3BFLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNwQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDVixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO1FBQy9DLE9BQU8sRUFBRSxDQUFBO0lBQ2IsQ0FBQztJQUVELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUE7UUFDN0QsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0QyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFDdEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFDOUQsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ3pGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNSLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUE7UUFDdkQsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQVEsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7UUFDN0QsS0FBSyxFQUFFLFdBQVc7UUFDbEIsSUFBSSxFQUFFLElBQUk7UUFDVixlQUFlLEVBQUcsT0FBZSxDQUFDLGVBQWUsSUFBSSxjQUFjO0tBQ3RFLENBQUMsQ0FBQTtJQUVGLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUE7UUFDaEQsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUE7SUFDMUMsT0FBTyxZQUFZLENBQUE7QUFDdkIsQ0FBQyxDQUFBIn0=