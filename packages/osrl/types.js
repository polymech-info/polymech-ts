"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EType = exports.FLAG = void 0;
;
var FLAG;
(function (FLAG) {
    /**
     * Instruct for no additional extra processing
     * @constant
     * @type int
     */
    FLAG[FLAG["NONE"] = 0] = "NONE";
    /**
     * Will instruct the pre/post processor to base-64 decode or encode
     * @constant
     * @type int
     */
    FLAG[FLAG["BASE_64"] = 1] = "BASE_64";
    /**
     * Post/Pre process the value with a user function
     * @constant
     * @type int
     */
    FLAG[FLAG["USE_FUNCTION"] = 2] = "USE_FUNCTION";
    /**
     * Replace variables with local scope's variables during the post/pre process
     * @constant
     * @type int
     */
    FLAG[FLAG["REPLACE_VARIABLES"] = 4] = "REPLACE_VARIABLES";
    /**
     * Replace variables with local scope's variables during the post/pre process but evaluate the whole string
     * as Javascript
     * @constant
     * @type int
     */
    FLAG[FLAG["REPLACE_VARIABLES_EVALUATED"] = 8] = "REPLACE_VARIABLES_EVALUATED";
    /**
     * Will instruct the pre/post processor to escpape evaluated or replaced variables or expressions
     * @constant
     * @type int
     */
    FLAG[FLAG["ESCAPE"] = 16] = "ESCAPE";
    /**
     * Will instruct the pre/post processor to replace block calls with oridinary vanilla script
     * @constant
     * @type int
     */
    FLAG[FLAG["REPLACE_BLOCK_CALLS"] = 32] = "REPLACE_BLOCK_CALLS";
    /**
     * Will instruct the pre/post processor to remove variable delimitters/placeholders from the final string
     * @constant
     * @type int
     */
    FLAG[FLAG["REMOVE_DELIMTTERS"] = 64] = "REMOVE_DELIMTTERS";
    /**
     * Will instruct the pre/post processor to remove   "[" ,"]" , "(" , ")" , "{", "}" , "*" , "+" , "."
     * @constant
     * @type int
     */
    FLAG[FLAG["ESCAPE_SPECIAL_CHARS"] = 128] = "ESCAPE_SPECIAL_CHARS";
    /**
     * Will instruct the pre/post processor to use regular expressions over string substitution
     * @constant
     * @type int
     */
    FLAG[FLAG["USE_REGEX"] = 256] = "USE_REGEX";
    /**
     * Will instruct the pre/post processor to use Filtrex (custom bison parser, needs xexpression) over string substitution
     * @constant
     * @type int
     */
    FLAG[FLAG["USE_FILTREX"] = 512] = "USE_FILTREX";
    /**
     * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
     * @constant
     * @type int
     */
    FLAG[FLAG["CASCADE"] = 1024] = "CASCADE";
    /**
     * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
     * @constant
     * @type int
     */
    FLAG[FLAG["EXPRESSION"] = 2048] = "EXPRESSION";
    /**
     * Dont parse anything
     * @constant
     * @type int
     */
    FLAG[FLAG["DONT_PARSE"] = 4096] = "DONT_PARSE";
    /**
     * Convert to hex
     * @constant
     * @type int
     */
    FLAG[FLAG["TO_HEX"] = 8192] = "TO_HEX";
    /**
     * Convert to hex
     * @constant
     * @type int
     */
    FLAG[FLAG["REPLACE_HEX"] = 16384] = "REPLACE_HEX";
    /**
     * Wait for finish
     * @constant
     * @type int
     */
    FLAG[FLAG["WAIT"] = 32768] = "WAIT";
    /**
     * Wait for finish
     * @constant
     * @type int
     */
    FLAG[FLAG["DONT_ESCAPE"] = 65536] = "DONT_ESCAPE";
    /**
     * Flag to mark the maximum core bit mask, after here its user land
     * @constant
     * @type int
     */
    FLAG[FLAG["END"] = 131072] = "END";
})(FLAG = exports.FLAG || (exports.FLAG = {}));
var EType;
(function (EType) {
    EType["Number"] = "Number";
    EType["String"] = "String";
    EType["Boolean"] = "Boolean";
    EType["Date"] = "Date";
    EType["TimeStamp"] = "TimeStamp";
    EType["Duration"] = "Duration";
    EType["Url"] = "Url";
    EType["UrlScheme"] = "Url-Scheme";
    EType["Asset"] = "Asset";
    EType["Symbol"] = "Symbol";
    EType["Value"] = "Value";
    EType["Values"] = "Values";
    EType["Attribute"] = "Attribute";
    EType["Parameter"] = "Parameter";
    EType["Operation"] = "Operation";
    EType["ParameterOperation"] = "ParameterOperation";
    EType["Template"] = "Template";
    EType["Arguments"] = "Arguments";
})(EType = exports.EType || (exports.EType = {}));
__exportStar(require("./zod_types"), exports);
__exportStar(require("./zod_schema"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNMEQsQ0FBQztBQWdCM0QsSUFBWSxJQW9IWDtBQXBIRCxXQUFZLElBQUk7SUFDZjs7OztPQUlHO0lBQ0gsK0JBQWlCLENBQUE7SUFDakI7Ozs7T0FJRztJQUNILHFDQUFvQixDQUFBO0lBQ3BCOzs7O09BSUc7SUFDSCwrQ0FBeUIsQ0FBQTtJQUN6Qjs7OztPQUlHO0lBQ0gseURBQThCLENBQUE7SUFDOUI7Ozs7O09BS0c7SUFDSCw2RUFBd0MsQ0FBQTtJQUN4Qzs7OztPQUlHO0lBQ0gsb0NBQW1CLENBQUE7SUFDbkI7Ozs7T0FJRztJQUNILDhEQUFnQyxDQUFBO0lBQ2hDOzs7O09BSUc7SUFDSCwwREFBOEIsQ0FBQTtJQUM5Qjs7OztPQUlHO0lBQ0gsaUVBQWlDLENBQUE7SUFDakM7Ozs7T0FJRztJQUNILDJDQUFzQixDQUFBO0lBQ3RCOzs7O09BSUc7SUFDSCwrQ0FBd0IsQ0FBQTtJQUN4Qjs7OztPQUlHO0lBQ0gsd0NBQW9CLENBQUE7SUFDcEI7Ozs7T0FJRztJQUNILDhDQUF1QixDQUFBO0lBQ3ZCOzs7O09BSUc7SUFDSCw4Q0FBd0IsQ0FBQTtJQUN4Qjs7OztPQUlHO0lBQ0gsc0NBQW9CLENBQUE7SUFDcEI7Ozs7T0FJRztJQUNILGlEQUF5QixDQUFBO0lBQ3pCOzs7O09BSUc7SUFDSCxtQ0FBa0IsQ0FBQTtJQUNsQjs7OztPQUlHO0lBQ0gsaURBQXlCLENBQUE7SUFDekI7Ozs7T0FJRztJQUNILGtDQUFpQixDQUFBO0FBQ2xCLENBQUMsRUFwSFcsSUFBSSxHQUFKLFlBQUksS0FBSixZQUFJLFFBb0hmO0FBNkRELElBQVksS0FvQlg7QUFwQkQsV0FBWSxLQUFLO0lBRWIsMEJBQWlCLENBQUE7SUFDakIsMEJBQWlCLENBQUE7SUFDakIsNEJBQW1CLENBQUE7SUFDbkIsc0JBQWEsQ0FBQTtJQUNiLGdDQUF1QixDQUFBO0lBQ3ZCLDhCQUFxQixDQUFBO0lBQ3JCLG9CQUFXLENBQUE7SUFDWCxpQ0FBd0IsQ0FBQTtJQUN4Qix3QkFBZSxDQUFBO0lBQ2YsMEJBQWlCLENBQUE7SUFDakIsd0JBQWUsQ0FBQTtJQUNmLDBCQUFpQixDQUFBO0lBQ2pCLGdDQUF1QixDQUFBO0lBQ3ZCLGdDQUF1QixDQUFBO0lBQ3ZCLGdDQUF1QixDQUFBO0lBQ3ZCLGtEQUF5QyxDQUFBO0lBQ3pDLDhCQUFxQixDQUFBO0lBQ3JCLGdDQUF1QixDQUFBO0FBQzNCLENBQUMsRUFwQlcsS0FBSyxHQUFMLGFBQUssS0FBTCxhQUFLLFFBb0JoQjtBQWtERCw4Q0FBMkI7QUFDM0IsK0NBQTRCIn0=