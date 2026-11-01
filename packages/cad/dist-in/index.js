import { resolve } from "@polymech/commons/variables";
export * from './types.js';
export * from './cad/sw-types.js';
export * from './cad/sw-lib.js';
export * from './_cli.js';
export * from './sw_argv.js';
export * from './lib/geometry/dxf.js';
import { Logger } from "tslog";
export function createLogger(name, options) {
    return new Logger({
        name,
        type: 'pretty',
        ...options,
    });
}
export const defaultLogger = createLogger('DefaultLogger', {
    minLevel: 1
});
import { MODULE_NAME } from './constants.js';
export { MODULE_NAME } from './constants.js';
export const logger = createLogger(MODULE_NAME, {});
export const substitute = resolve;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE9BQU8sRUFBRyxNQUFNLDZCQUE2QixDQUFBO0FBRXRELGNBQWMsWUFBWSxDQUFBO0FBQzFCLGNBQWMsbUJBQW1CLENBQUE7QUFDakMsY0FBYyxpQkFBaUIsQ0FBQTtBQUMvQixjQUFjLFdBQVcsQ0FBQTtBQUN6QixjQUFjLGNBQWMsQ0FBQTtBQUM1QixjQUFjLHVCQUF1QixDQUFBO0FBRXJDLE9BQU8sRUFBRyxNQUFNLEVBQUUsTUFBTSxPQUFPLENBQUE7QUFFL0IsTUFBTSxVQUFVLFlBQVksQ0FBQyxJQUFZLEVBQUUsT0FBYTtJQUNwRCxPQUFPLElBQUksTUFBTSxDQUFDO1FBQ2QsSUFBSTtRQUNKLElBQUksRUFBRSxRQUFRO1FBQ2QsR0FBRyxPQUFPO0tBQ2IsQ0FBQyxDQUFBO0FBQ04sQ0FBQztBQUNELE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsZUFBZSxFQUFFO0lBQ3ZELFFBQVEsRUFBRSxDQUFDO0NBQ2QsQ0FBQyxDQUFBO0FBRUYsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQzVDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUU1QyxNQUFNLENBQUMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUVuRCxNQUFNLENBQUMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFBIn0=