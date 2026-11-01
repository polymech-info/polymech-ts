"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGGING_FLAGS = exports.LOGGING_SIGNAL = exports.COMMANDS = exports.EVENTS = void 0;
exports.EVENTS = {};
var COMMANDS;
(function (COMMANDS) {
    COMMANDS["RUN_FILE"] = "Run_File";
    COMMANDS["RUN_CLASS"] = "Run_Class";
    COMMANDS["RUN_APP_SERVER_CLASS"] = "Run_App_Server_Class";
    COMMANDS["RUN_APP_SERVER_CLASS_METHOD"] = "Run_App_Server_Class_Method";
    COMMANDS["RUN_APP_SERVER_COMPONENT_METHOD"] = "Run_App_Server_Component_Method";
    COMMANDS["CANCEL_APP_SERVER_COMPONENT_METHOD"] = "Cancel_App_Server_Component_Method";
    COMMANDS["ANSWER_APP_SERVER_COMPONENT_METHOD_INTERRUPT"] = "Answer_App_Server_Component_Method_Interrupt";
})(COMMANDS = exports.COMMANDS || (exports.COMMANDS = {}));
var LOGGING_SIGNAL;
(function (LOGGING_SIGNAL) {
})(LOGGING_SIGNAL = exports.LOGGING_SIGNAL || (exports.LOGGING_SIGNAL = {}));
;
var LOGGING_FLAGS;
(function (LOGGING_FLAGS) {
    /**
     * No logging
     * @constant
     * @type int
     */
    LOGGING_FLAGS[LOGGING_FLAGS["NONE"] = 0] = "NONE";
    /**
     * Log in the IDE's global console
     * @constant
     * @type int
     */
    LOGGING_FLAGS[LOGGING_FLAGS["GLOBAL_CONSOLE"] = 1] = "GLOBAL_CONSOLE";
    /**
     * Log in the IDE's status bar
     * @constant
     * @type int
     */
    LOGGING_FLAGS[LOGGING_FLAGS["STATUS_BAR"] = 2] = "STATUS_BAR";
    /**
     * Create notification popup in the IDE
     * @constant
     * @type int
     */
    LOGGING_FLAGS[LOGGING_FLAGS["POPUP"] = 4] = "POPUP";
    /**
     * Log to file
     * @constant
     * @type int
     */
    LOGGING_FLAGS[LOGGING_FLAGS["FILE"] = 8] = "FILE";
    /**
     * Log into the IDE's dev tool's console
     * @constant
     * @type int
     */
    LOGGING_FLAGS[LOGGING_FLAGS["DEV_CONSOLE"] = 16] = "DEV_CONSOLE";
})(LOGGING_FLAGS = exports.LOGGING_FLAGS || (exports.LOGGING_FLAGS = {}));
;
//# sourceMappingURL=enums.js.map