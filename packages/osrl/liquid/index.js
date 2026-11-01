"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseText = exports.engineDefault = exports.engine = exports.dir = void 0;
const fs_1 = require("../fs");
const liquid_1 = require("../liquidjs/liquid");
var dir_1 = require("@plastichub/fs/dir");
Object.defineProperty(exports, "dir", { enumerable: true, get: function () { return dir_1.sync; } });
const engine = (options) => {
    const engine = new liquid_1.Liquid(options);
    return engine;
};
exports.engine = engine;
const engineDefault = (options) => {
    const delimitters = options.language === 'osr' ?
        {
            tagDelimiterLeft: '[%',
            tagDelimiterRight: '%]',
            outputDelimiterLeft: '[[',
            outputDelimiterRight: ']]'
        } : {};
    const lOptions = Object.assign(Object.assign({ keepOutputType: true, trimOutputRight: false, trimOutputLeft: false, trimTagRight: false, trimTagLeft: false, greedy: false, cache: false }, options), delimitters);
    return new liquid_1.Liquid(lOptions);
};
exports.engineDefault = engineDefault;
/**
 *
 * @param string
 * @param vars
 * @param options
 * @see https://liquidjs.com/tags/overview.html
 * @returns
 */
function parseText(string, vars, iterations = 5, options = null) {
    return __awaiter(this, void 0, void 0, function* () {
        const l = (0, exports.engine)(options);
        options = Object.assign({ fs: (0, fs_1.defaultFS)(options.resolve) }, options);
        let t = yield l.parseAndRender(string, vars, options);
        for (let i = 0; i < iterations; i++) {
            t = yield l.parseAndRender(t, vars, options);
        }
        return t;
    });
}
exports.parseText = parseText;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGlxdWlkL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDhCQUFpQztBQUNqQywrQ0FBMkM7QUFJM0MsMENBQWdEO0FBQXZDLDBGQUFBLElBQUksT0FBTztBQUViLE1BQU0sTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDOUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDbEMsT0FBTyxNQUFNLENBQUE7QUFDakIsQ0FBQyxDQUFBO0FBSFksUUFBQSxNQUFNLFVBR2xCO0FBRU0sTUFBTSxhQUFhLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRTtJQUNyQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxDQUFDO1FBQzVDO1lBQ0ksZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLG1CQUFtQixFQUFFLElBQUk7WUFDekIsb0JBQW9CLEVBQUUsSUFBSTtTQUM3QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7SUFFVixNQUFNLFFBQVEsaUNBQ1YsY0FBYyxFQUFFLElBQUksRUFDcEIsZUFBZSxFQUFFLEtBQUssRUFDdEIsY0FBYyxFQUFFLEtBQUssRUFDckIsWUFBWSxFQUFFLEtBQUssRUFDbkIsV0FBVyxFQUFFLEtBQUssRUFDbEIsTUFBTSxFQUFFLEtBQUssRUFDYixLQUFLLEVBQUUsS0FBSyxJQUNULE9BQU8sR0FDUCxXQUFXLENBQ2pCLENBQUM7SUFDRixPQUFPLElBQUksZUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQy9CLENBQUMsQ0FBQTtBQXJCWSxRQUFBLGFBQWEsaUJBcUJ6QjtBQUNEOzs7Ozs7O0dBT0c7QUFDSCxTQUFzQixTQUFTLENBQUMsTUFBYyxFQUFFLElBQVMsRUFBRSxhQUFxQixDQUFDLEVBQUUsVUFBb0IsSUFBSTs7UUFDdkcsTUFBTSxDQUFDLEdBQUcsSUFBQSxjQUFNLEVBQUMsT0FBTyxDQUFDLENBQUE7UUFDekIsT0FBTyxHQUFHLGdCQUNOLEVBQUUsRUFBRSxJQUFBLGNBQVMsRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQzNCLE9BQU8sQ0FDTixDQUFDO1FBQ1QsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBYyxDQUFDLENBQUM7UUFDN0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNqQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBYyxDQUFDLENBQUM7U0FDdkQ7UUFDRCxPQUFPLENBQUMsQ0FBQztJQUNiLENBQUM7Q0FBQTtBQVhELDhCQVdDIn0=