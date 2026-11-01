"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.os = void 0;
const os_1 = require("os");
const os = () => {
    if ((0, os_1.platform)() === 'win32') {
        return 'windows';
    }
    else if ((0, os_1.platform)() === 'darwin') {
        return 'osx';
    }
    else if ((0, os_1.arch)() === 'arm') {
        return 'arm';
    }
    return 'linux';
};
exports.os = os;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2NvbW1vbi9wbGF0Zm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQkFBb0M7QUFFN0IsTUFBTSxFQUFFLEdBQUcsR0FBRyxFQUFFO0lBQ3JCLElBQUksSUFBQSxhQUFRLEdBQUUsS0FBSyxPQUFPLEVBQUU7UUFDMUIsT0FBTyxTQUFTLENBQUM7S0FDbEI7U0FBTSxJQUFJLElBQUEsYUFBUSxHQUFFLEtBQUssUUFBUSxFQUFFO1FBQ2xDLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7U0FBTSxJQUFJLElBQUEsU0FBSSxHQUFFLEtBQUssS0FBSyxFQUFFO1FBQzNCLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDLENBQUE7QUFUWSxRQUFBLEVBQUUsTUFTZCJ9