"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = void 0;
// tweaks and handlers
exports.defaults = function () {
    // default command
    var DefaultCommand = 'summary';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    // currently no default handler, display only :
    process.on('unhandledRejection', function (reason) {
        console.error('Unhandled rejection, reason: ', reason);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NsaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9fY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHNCQUFzQjtBQUNULFFBQUEsUUFBUSxHQUFHO0lBQ3BCLGtCQUFrQjtJQUNsQixJQUFNLGNBQWMsR0FBRyxTQUFTLENBQUM7SUFDakMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDckM7SUFFRCwrQ0FBK0M7SUFDL0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxVQUFDLE1BQWM7UUFDNUMsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyJ9