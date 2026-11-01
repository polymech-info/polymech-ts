"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.date = void 0;
const strftime_1 = require("../../util/strftime");
const underscore_1 = require("../../util/underscore");
const timezone_date_1 = require("../../util/timezone-date");
function date(v, arg) {
    const opts = this.context.opts;
    let date;
    v = (0, underscore_1.toValue)(v);
    arg = (0, underscore_1.stringify)(arg);
    if (v === 'now' || v === 'today') {
        date = new Date();
    }
    else if ((0, underscore_1.isNumber)(v)) {
        date = new Date(v * 1000);
    }
    else if ((0, underscore_1.isString)(v)) {
        if (/^\d+$/.test(v)) {
            date = new Date(+v * 1000);
        }
        else if (opts.preserveTimezones) {
            date = timezone_date_1.TimezoneDate.createDateFixedToTimezone(v);
        }
        else {
            date = new Date(v);
        }
    }
    else {
        date = v;
    }
    if (!isValidDate(date))
        return v;
    if (opts.hasOwnProperty('timezoneOffset')) {
        date = new timezone_date_1.TimezoneDate(date, opts.timezoneOffset);
    }
    return (0, strftime_1.default)(date, arg);
}
exports.date = date;
function isValidDate(date) {
    return (date instanceof Date || date instanceof timezone_date_1.TimezoneDate) && !isNaN(date.getTime());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL2ZpbHRlcnMvZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFBMEM7QUFFMUMsc0RBQThFO0FBRTlFLDREQUF1RDtBQUV2RCxTQUFnQixJQUFJLENBQW9CLENBQWdCLEVBQUUsR0FBVztJQUNuRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQTtJQUM5QixJQUFJLElBQWdCLENBQUE7SUFDcEIsQ0FBQyxHQUFHLElBQUEsb0JBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQTtJQUNkLEdBQUcsR0FBRyxJQUFBLHNCQUFTLEVBQUMsR0FBRyxDQUFDLENBQUE7SUFDcEIsSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxPQUFPLEVBQUU7UUFDaEMsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUE7S0FDbEI7U0FBTSxJQUFJLElBQUEscUJBQVEsRUFBQyxDQUFDLENBQUMsRUFBRTtRQUN0QixJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQzFCO1NBQU0sSUFBSSxJQUFBLHFCQUFRLEVBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDdEIsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ25CLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtTQUMzQjthQUFNLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQ2pDLElBQUksR0FBRyw0QkFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ2pEO2FBQU07WUFDTCxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDbkI7S0FDRjtTQUFNO1FBQ0wsSUFBSSxHQUFHLENBQUMsQ0FBQTtLQUNUO0lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7UUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNoQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtRQUN6QyxJQUFJLEdBQUcsSUFBSSw0QkFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsY0FBZSxDQUFDLENBQUE7S0FDcEQ7SUFDRCxPQUFPLElBQUEsa0JBQVEsRUFBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7QUFDNUIsQ0FBQztBQXpCRCxvQkF5QkM7QUFFRCxTQUFTLFdBQVcsQ0FBRSxJQUFTO0lBQzdCLE9BQU8sQ0FBQyxJQUFJLFlBQVksSUFBSSxJQUFJLElBQUksWUFBWSw0QkFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7QUFDekYsQ0FBQyJ9