"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimezoneDate = void 0;
// one minute in milliseconds
const OneMinute = 60000;
const hostTimezoneOffset = new Date().getTimezoneOffset();
const ISO8601_TIMEZONE_PATTERN = /([zZ]|([+-])(\d{2}):(\d{2}))$/;
/**
 * A date implementation with timezone info, just like Ruby date
 *
 * Implementation:
 * - create a Date offset by it's timezone difference, avoiding overriding a bunch of methods
 * - rewrite getTimezoneOffset() to trick strftime
 */
class TimezoneDate {
    constructor(init, timezoneOffset) {
        if (init instanceof TimezoneDate) {
            this.date = init.date;
            timezoneOffset = init.timezoneOffset;
        }
        else {
            const diff = (hostTimezoneOffset - timezoneOffset) * OneMinute;
            const time = new Date(init).getTime() + diff;
            this.date = new Date(time);
        }
        this.timezoneOffset = timezoneOffset;
    }
    getTime() {
        return this.date.getTime();
    }
    getMilliseconds() {
        return this.date.getMilliseconds();
    }
    getSeconds() {
        return this.date.getSeconds();
    }
    getMinutes() {
        return this.date.getMinutes();
    }
    getHours() {
        return this.date.getHours();
    }
    getDay() {
        return this.date.getDay();
    }
    getDate() {
        return this.date.getDate();
    }
    getMonth() {
        return this.date.getMonth();
    }
    getFullYear() {
        return this.date.getFullYear();
    }
    toLocaleTimeString(locale) {
        return this.date.toLocaleTimeString(locale);
    }
    toLocaleDateString(locale) {
        return this.date.toLocaleDateString(locale);
    }
    getTimezoneOffset() {
        return this.timezoneOffset;
    }
    /**
     * Create a Date object fixed to it's declared Timezone. Both
     * - 2021-08-06T02:29:00.000Z and
     * - 2021-08-06T02:29:00.000+08:00
     * will always be displayed as
     * - 2021-08-06 02:29:00
     * regardless timezoneOffset in JavaScript realm
     *
     * The implementation hack:
     * Instead of calling `.getMonth()`/`.getUTCMonth()` respect to `preserveTimezones`,
     * we create a different Date to trick strftime, it's both simpler and more performant.
     * Given that a template is expected to be parsed fewer times than rendered.
     */
    static createDateFixedToTimezone(dateString) {
        const m = dateString.match(ISO8601_TIMEZONE_PATTERN);
        // representing a UTC timestamp
        if (m && m[1] === 'Z') {
            return new TimezoneDate(+new Date(dateString), 0);
        }
        // has a timezone specified
        if (m && m[2] && m[3] && m[4]) {
            const [, , sign, hours, minutes] = m;
            const delta = (sign === '+' ? -1 : 1) * (parseInt(hours, 10) * 60 + parseInt(minutes, 10));
            return new TimezoneDate(+new Date(dateString), delta);
        }
        return new Date(dateString);
    }
}
exports.TimezoneDate = TimezoneDate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXpvbmUtZGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy91dGlsL3RpbWV6b25lLWRhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsNkJBQTZCO0FBQzdCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQTtBQUN2QixNQUFNLGtCQUFrQixHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtBQUN6RCxNQUFNLHdCQUF3QixHQUFHLCtCQUErQixDQUFBO0FBRWhFOzs7Ozs7R0FNRztBQUNILE1BQWEsWUFBWTtJQUd2QixZQUFhLElBQTJDLEVBQUUsY0FBc0I7UUFDOUUsSUFBSSxJQUFJLFlBQVksWUFBWSxFQUFFO1lBQ2hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtZQUNyQixjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQTtTQUNyQzthQUFNO1lBQ0wsTUFBTSxJQUFJLEdBQUcsQ0FBQyxrQkFBa0IsR0FBRyxjQUFjLENBQUMsR0FBRyxTQUFTLENBQUE7WUFDOUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBQzVDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDM0I7UUFDRCxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTtJQUN0QyxDQUFDO0lBRUQsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUM1QixDQUFDO0lBRUQsZUFBZTtRQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtJQUNwQyxDQUFDO0lBQ0QsVUFBVTtRQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUMvQixDQUFDO0lBQ0QsVUFBVTtRQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUMvQixDQUFDO0lBQ0QsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM3QixDQUFDO0lBQ0QsTUFBTTtRQUNKLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUMzQixDQUFDO0lBQ0QsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUM1QixDQUFDO0lBQ0QsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM3QixDQUFDO0lBQ0QsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUNoQyxDQUFDO0lBQ0Qsa0JBQWtCLENBQUUsTUFBZTtRQUNqQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUNELGtCQUFrQixDQUFFLE1BQWU7UUFDakMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzdDLENBQUM7SUFDRCxpQkFBaUI7UUFDZixPQUFPLElBQUksQ0FBQyxjQUFlLENBQUE7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILE1BQU0sQ0FBQyx5QkFBeUIsQ0FBRSxVQUFrQjtRQUNsRCxNQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUE7UUFDcEQsK0JBQStCO1FBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDckIsT0FBTyxJQUFJLFlBQVksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1NBQ2xEO1FBQ0QsMkJBQTJCO1FBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLEFBQUQsRUFBRyxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNwQyxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUMxRixPQUFPLElBQUksWUFBWSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7U0FDdEQ7UUFDRCxPQUFPLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0lBQzdCLENBQUM7Q0FDRjtBQWhGRCxvQ0FnRkMifQ==