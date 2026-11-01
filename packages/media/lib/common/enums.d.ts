export declare const EVENTS: {};
export declare enum COMMANDS {
    RUN_FILE = "Run_File",
    RUN_CLASS = "Run_Class",
    RUN_APP_SERVER_CLASS = "Run_App_Server_Class",
    RUN_APP_SERVER_CLASS_METHOD = "Run_App_Server_Class_Method",
    RUN_APP_SERVER_COMPONENT_METHOD = "Run_App_Server_Component_Method",
    CANCEL_APP_SERVER_COMPONENT_METHOD = "Cancel_App_Server_Component_Method",
    ANSWER_APP_SERVER_COMPONENT_METHOD_INTERRUPT = "Answer_App_Server_Component_Method_Interrupt"
}
export declare enum LOGGING_SIGNAL {
}
export declare enum LOGGING_FLAGS {
    /**
     * No logging
     * @constant
     * @type int
     */
    NONE = 0,
    /**
     * Log in the IDE's global console
     * @constant
     * @type int
     */
    GLOBAL_CONSOLE = 1,
    /**
     * Log in the IDE's status bar
     * @constant
     * @type int
     */
    STATUS_BAR = 2,
    /**
     * Create notification popup in the IDE
     * @constant
     * @type int
     */
    POPUP = 4,
    /**
     * Log to file
     * @constant
     * @type int
     */
    FILE = 8,
    /**
     * Log into the IDE's dev tool's console
     * @constant
     * @type int
     */
    DEV_CONSOLE = 16
}
