import * as fs from 'node:fs';
import { sync as writeSync } from './write.js';
import { validateArgument, validateOptions } from './utils/validate.js';
export const validateInput = (methodName, path, data, options) => {
    const methodSignature = methodName + '(path, data, [options])';
    validateArgument(methodSignature, 'path', path, ['string']);
    validateArgument(methodSignature, 'data', data, ['string', 'buffer']);
    validateOptions(methodSignature, 'options', options, {
        mode: ['string', 'number']
    });
};
// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------
export const sync = (path, data, options) => {
    try {
        fs.appendFileSync(path, data, options ? { encoding: options.encoding, mode: options.mode } : {});
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            // Parent directory doesn't exist, so just pass the task to `write`,
            // which will create the folder and file.
            writeSync(path, data, options);
        }
        else {
            throw err;
        }
    }
};
export const async = (path, data, options) => {
    return fs.promises.appendFile(path, data, options);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwZW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcGVuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssRUFBRSxNQUFNLFNBQVMsQ0FBQTtBQUM3QixPQUFPLEVBQUUsSUFBSSxJQUFJLFNBQVMsRUFBdUIsTUFBTSxZQUFZLENBQUE7QUFFbkUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBTXZFLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxDQUFDLFVBQWtCLEVBQUUsSUFBWSxFQUFFLElBQVMsRUFBRSxPQUFpQixFQUFFLEVBQUU7SUFDOUYsTUFBTSxlQUFlLEdBQUcsVUFBVSxHQUFHLHlCQUF5QixDQUFDO0lBQy9ELGdCQUFnQixDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM1RCxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLGVBQWUsQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRTtRQUNuRCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO0tBQzNCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUNGLDREQUE0RDtBQUM1RCxPQUFPO0FBQ1AsNERBQTREO0FBQzVELE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLElBQVksRUFBRSxJQUFTLEVBQUUsT0FBZ0IsRUFBUSxFQUFFO0lBQ3RFLElBQUksQ0FBQztRQUNILEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUEwQixFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9ILENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzFCLG9FQUFvRTtZQUNwRSx5Q0FBeUM7WUFDekMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDakMsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLEdBQUcsQ0FBQztRQUNaLENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBRUYsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBWSxFQUFFLElBQXlCLEVBQUUsT0FBaUIsRUFBaUIsRUFBRTtJQUNqRyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBYyxDQUFDLENBQUE7QUFDM0QsQ0FBQyxDQUFDIn0=