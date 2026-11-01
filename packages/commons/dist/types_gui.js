/**
 * Flags to describe a block's execution behavior.
 *
 * @enum {integer} module=xide/types/RUN_FLAGS
 * @memberOf module=xide/types
 */
export var RUN_FLAGS;
(function (RUN_FLAGS) {
    /**
     * The block can execute child blocks.
     * @constant
     * @type int
     */
    RUN_FLAGS[RUN_FLAGS["CHILDREN"] = 32] = "CHILDREN";
    /**
     * Block is waiting for a message => EXECUTION_STATE==RUNNING
     * @constant
     * @type int
     */
    RUN_FLAGS[RUN_FLAGS["WAIT"] = 32768] = "WAIT";
})(RUN_FLAGS || (RUN_FLAGS = {}));
;
/**
 * Flags to describe a block's execution state.
 *
 * @enum {integer} module=xide/types/EXECUTION_STATE
 * @memberOf module=xide/types
 */
export var EXECUTION_STATE;
(function (EXECUTION_STATE) {
    /**
     * The block is doing nothing and also has done nothing. The is the default state
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["NONE"] = 0] = "NONE";
    /**
     * The block is running.
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["RUNNING"] = 1] = "RUNNING";
    /**
     * The block is an error state.
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["ERROR"] = 2] = "ERROR";
    /**
     * The block is in an paused state.
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["PAUSED"] = 4] = "PAUSED";
    /**
     * The block is an finished state, ready to be cleared to "NONE" at the next frame.
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["FINISH"] = 8] = "FINISH";
    /**
     * The block is an stopped state, ready to be cleared to "NONE" at the next frame.
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["STOPPED"] = 16] = "STOPPED";
    /**
     * The block has been launched once...
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["ONCE"] = 2147483648] = "ONCE";
    /**
     * Block will be reseted next frame
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["RESET_NEXT_FRAME"] = 8388608] = "RESET_NEXT_FRAME";
    /**
     * Block is locked and so no further inputs can be activated.
     * @constant
     * @type int
     */
    EXECUTION_STATE[EXECUTION_STATE["LOCKED"] = 536870912] = "LOCKED"; // Block is locked for utilisation in xblox
})(EXECUTION_STATE || (EXECUTION_STATE = {}));
export var BLOCK_MODE;
(function (BLOCK_MODE) {
    BLOCK_MODE[BLOCK_MODE["NORMAL"] = 0] = "NORMAL";
    BLOCK_MODE[BLOCK_MODE["UPDATE_WIDGET_PROPERTY"] = 1] = "UPDATE_WIDGET_PROPERTY";
})(BLOCK_MODE || (BLOCK_MODE = {}));
;
/**
 * Flags to describe a block's belonging to a standard signal.
 * @enum {integer} module=xblox/types/BLOCK_OUTLET
 * @memberOf module=xblox/types
 */
export var BLOCK_OUTLET;
(function (BLOCK_OUTLET) {
    BLOCK_OUTLET[BLOCK_OUTLET["NONE"] = 0] = "NONE";
    BLOCK_OUTLET[BLOCK_OUTLET["PROGRESS"] = 1] = "PROGRESS";
    BLOCK_OUTLET[BLOCK_OUTLET["ERROR"] = 2] = "ERROR";
    BLOCK_OUTLET[BLOCK_OUTLET["PAUSED"] = 4] = "PAUSED";
    BLOCK_OUTLET[BLOCK_OUTLET["FINISH"] = 8] = "FINISH";
    BLOCK_OUTLET[BLOCK_OUTLET["STOPPED"] = 16] = "STOPPED";
})(BLOCK_OUTLET || (BLOCK_OUTLET = {}));
;
export var EVENTS;
(function (EVENTS) {
    EVENTS["ON_RUN_BLOCK"] = "onRunBlock";
    EVENTS["ON_RUN_BLOCK_FAILED"] = "onRunBlockFailed";
    EVENTS["ON_RUN_BLOCK_SUCCESS"] = "onRunBlockSuccess";
    EVENTS["ON_BLOCK_SELECTED"] = "onItemSelected";
    EVENTS["ON_BLOCK_UNSELECTED"] = "onBlockUnSelected";
    EVENTS["ON_BLOCK_EXPRESSION_FAILED"] = "onExpressionFailed";
    EVENTS["ON_BUILD_BLOCK_INFO_LIST"] = "onBuildBlockInfoList";
    EVENTS["ON_BUILD_BLOCK_INFO_LIST_END"] = "onBuildBlockInfoListEnd";
    EVENTS["ON_BLOCK_PROPERTY_CHANGED"] = "onBlockPropertyChanged";
    EVENTS["ON_SCOPE_CREATED"] = "onScopeCreated";
    EVENTS["ON_VARIABLE_CHANGED"] = "onVariableChanged";
    EVENTS["ON_CREATE_VARIABLE_CI"] = "onCreateVariableCI";
})(EVENTS || (EVENTS = {}));
export var BlockType;
(function (BlockType) {
    BlockType["AssignmentExpression"] = "AssignmentExpression";
    BlockType["ArrayExpression"] = "ArrayExpression";
    BlockType["BlockStatement"] = "BlockStatement";
    BlockType["BinaryExpression"] = "BinaryExpression";
    BlockType["BreakStatement"] = "BreakStatement";
    BlockType["CallExpression"] = "CallExpression";
    BlockType["CatchClause"] = "CatchClause";
    BlockType["ConditionalExpression"] = "ConditionalExpression";
    BlockType["ContinueStatement"] = "ContinueStatement";
    BlockType["DoWhileStatement"] = "DoWhileStatement";
    BlockType["DebuggerStatement"] = "DebuggerStatement";
    BlockType["EmptyStatement"] = "EmptyStatement";
    BlockType["ExpressionStatement"] = "ExpressionStatement";
    BlockType["ForStatement"] = "ForStatement";
    BlockType["ForInStatement"] = "ForInStatement";
    BlockType["FunctionDeclaration"] = "FunctionDeclaration";
    BlockType["FunctionExpression"] = "FunctionExpression";
    BlockType["Identifier"] = "Identifier";
    BlockType["IfStatement"] = "IfStatement";
    BlockType["Literal"] = "Literal";
    BlockType["LabeledStatement"] = "LabeledStatement";
    BlockType["LogicalExpression"] = "LogicalExpression";
    BlockType["MemberExpression"] = "MemberExpression";
    BlockType["NewExpression"] = "NewExpression";
    BlockType["ObjectExpression"] = "ObjectExpression";
    BlockType["Program"] = "Program";
    BlockType["Property"] = "Property";
    BlockType["ReturnStatement"] = "ReturnStatement";
    BlockType["SequenceExpression"] = "SequenceExpression";
    BlockType["SwitchStatement"] = "SwitchStatement";
    BlockType["SwitchCase"] = "SwitchCase";
    BlockType["ThisExpression"] = "ThisExpression";
    BlockType["ThrowStatement"] = "ThrowStatement";
    BlockType["TryStatement"] = "TryStatement";
    BlockType["UnaryExpression"] = "UnaryExpression";
    BlockType["UpdateExpression"] = "UpdateExpression";
    BlockType["VariableDeclaration"] = "VariableDeclaration";
    BlockType["VariableDeclarator"] = "VariableDeclarator";
    BlockType["WhileStatement"] = "WhileStatement";
    BlockType["WithStatement"] = "WithStatement";
})(BlockType || (BlockType = {}));
;
/**
 * Variable Flags
 *
 * @enum {int} VARIABLE_FLAGS
 * @global
 */
export var VARIABLE_FLAGS;
(function (VARIABLE_FLAGS) {
    VARIABLE_FLAGS[VARIABLE_FLAGS["PUBLISH"] = 2] = "PUBLISH";
    VARIABLE_FLAGS[VARIABLE_FLAGS["PUBLISH_IF_SERVER"] = 4] = "PUBLISH_IF_SERVER";
})(VARIABLE_FLAGS || (VARIABLE_FLAGS = {}));
;
export var BLOCK_GROUPS;
(function (BLOCK_GROUPS) {
    BLOCK_GROUPS["VARIABLE"] = "DriverVariable";
    BLOCK_GROUPS["BASIC_COMMAND"] = "DriverBasicCommand";
    BLOCK_GROUPS["CONDITIONAL_COMMAND"] = "DriverConditionalCommand";
    BLOCK_GROUPS["RESPONSE_VARIABLE"] = "DriverResponseVariable";
    BLOCK_GROUPS["RESPONSE_BLOCKS"] = "conditionalProcess";
    BLOCK_GROUPS["RESPONSE_VARIABLES"] = "processVariables";
    BLOCK_GROUPS["BASIC_VARIABLES"] = "basicVariables";
})(BLOCK_GROUPS || (BLOCK_GROUPS = {}));
;
export var COMMAND_TYPES;
(function (COMMAND_TYPES) {
    COMMAND_TYPES["BASIC_COMMAND"] = "basic";
    COMMAND_TYPES["CONDITIONAL_COMMAND"] = "conditional";
    COMMAND_TYPES["INIT_COMMAND"] = "init";
})(COMMAND_TYPES || (COMMAND_TYPES = {}));
;
export var CIFLAG;
(function (CIFLAG) {
    /**
     * Instruct for no additional extra processing
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["NONE"] = 0] = "NONE";
    /**
     * Will instruct the pre/post processor to base-64 decode or encode
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["BASE_64"] = 1] = "BASE_64";
    /**
     * Post/Pre process the value with a user function
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["USE_FUNCTION"] = 2] = "USE_FUNCTION";
    /**
     * Replace variables with local scope's variables during the post/pre process
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["REPLACE_VARIABLES"] = 4] = "REPLACE_VARIABLES";
    /**
     * Replace variables with local scope's variables during the post/pre process but evaluate the whole string
     * as Javascript
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["REPLACE_VARIABLES_EVALUATED"] = 8] = "REPLACE_VARIABLES_EVALUATED";
    /**
     * Will instruct the pre/post processor to escpape evaluated or replaced variables or expressions
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["ESCAPE"] = 16] = "ESCAPE";
    /**
     * Will instruct the pre/post processor to replace block calls with oridinary vanilla script
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["REPLACE_BLOCK_CALLS"] = 32] = "REPLACE_BLOCK_CALLS";
    /**
     * Will instruct the pre/post processor to remove variable delimitters/placeholders from the final string
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["REMOVE_DELIMTTERS"] = 64] = "REMOVE_DELIMTTERS";
    /**
     * Will instruct the pre/post processor to remove   "[" ,"]" , "(" , ")" , "{", "}" , "*" , "+" , "."
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["ESCAPE_SPECIAL_CHARS"] = 128] = "ESCAPE_SPECIAL_CHARS";
    /**
     * Will instruct the pre/post processor to use regular expressions over string substitution
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["USE_REGEX"] = 256] = "USE_REGEX";
    /**
     * Will instruct the pre/post processor to use Filtrex (custom bison parser, needs xexpression) over string substitution
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["USE_FILTREX"] = 512] = "USE_FILTREX";
    /**
     * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["CASCADE"] = 1024] = "CASCADE";
    /**
     * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["EXPRESSION"] = 2048] = "EXPRESSION";
    /**
     * Dont parse anything
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["DONT_PARSE"] = 4096] = "DONT_PARSE";
    /**
     * Convert to hex
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["TO_HEX"] = 8192] = "TO_HEX";
    /**
     * Convert to hex
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["REPLACE_HEX"] = 16384] = "REPLACE_HEX";
    /**
     * Wait for finish
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["WAIT"] = 32768] = "WAIT";
    /**
     * Wait for finish
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["DONT_ESCAPE"] = 65536] = "DONT_ESCAPE";
    /**
     * Flag to mark the maximum core bit mask, after here its user land
     * @constant
     * @type int
     */
    CIFLAG[CIFLAG["END"] = 131072] = "END";
})(CIFLAG || (CIFLAG = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNfZ3VpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3R5cGVzX2d1aS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBTixJQUFZLFNBYVg7QUFiRCxXQUFZLFNBQVM7SUFDakI7Ozs7T0FJRztJQUNILGtEQUFxQixDQUFBO0lBQ3JCOzs7O09BSUc7SUFDSCw2Q0FBa0IsQ0FBQTtBQUN0QixDQUFDLEVBYlcsU0FBUyxLQUFULFNBQVMsUUFhcEI7QUFBQSxDQUFDO0FBRUY7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQU4sSUFBWSxlQXVEWDtBQXZERCxXQUFZLGVBQWU7SUFDdkI7Ozs7T0FJRztJQUNILHFEQUFpQixDQUFBO0lBQ2pCOzs7O09BSUc7SUFDSCwyREFBb0IsQ0FBQTtJQUNwQjs7OztPQUlHO0lBQ0gsdURBQWtCLENBQUE7SUFDbEI7Ozs7T0FJRztJQUNILHlEQUFtQixDQUFBO0lBQ25COzs7O09BSUc7SUFDSCx5REFBbUIsQ0FBQTtJQUNuQjs7OztPQUlHO0lBQ0gsNERBQW9CLENBQUE7SUFDcEI7Ozs7T0FJRztJQUNILDhEQUFpQixDQUFBO0lBQ2pCOzs7O09BSUc7SUFDSCxtRkFBNkIsQ0FBQTtJQUM3Qjs7OztPQUlHO0lBQ0gsaUVBQW1CLENBQUEsQ0FBQywyQ0FBMkM7QUFDbkUsQ0FBQyxFQXZEVyxlQUFlLEtBQWYsZUFBZSxRQXVEMUI7QUFFRCxNQUFNLENBQU4sSUFBWSxVQUdYO0FBSEQsV0FBWSxVQUFVO0lBQ2xCLCtDQUFVLENBQUE7SUFDViwrRUFBMEIsQ0FBQTtBQUM5QixDQUFDLEVBSFcsVUFBVSxLQUFWLFVBQVUsUUFHckI7QUFBQSxDQUFDO0FBRUY7Ozs7R0FJRztBQUNILE1BQU0sQ0FBTixJQUFZLFlBT1g7QUFQRCxXQUFZLFlBQVk7SUFDcEIsK0NBQWlCLENBQUE7SUFDakIsdURBQXFCLENBQUE7SUFDckIsaURBQWtCLENBQUE7SUFDbEIsbURBQW1CLENBQUE7SUFDbkIsbURBQW1CLENBQUE7SUFDbkIsc0RBQW9CLENBQUE7QUFDeEIsQ0FBQyxFQVBXLFlBQVksS0FBWixZQUFZLFFBT3ZCO0FBQUEsQ0FBQztBQUVGLE1BQU0sQ0FBTixJQUFZLE1BYVg7QUFiRCxXQUFZLE1BQU07SUFDZCxxQ0FBMkIsQ0FBQTtJQUMzQixrREFBd0MsQ0FBQTtJQUN4QyxvREFBMEMsQ0FBQTtJQUMxQyw4Q0FBb0MsQ0FBQTtJQUNwQyxtREFBeUMsQ0FBQTtJQUN6QywyREFBaUQsQ0FBQTtJQUNqRCwyREFBaUQsQ0FBQTtJQUNqRCxrRUFBd0QsQ0FBQTtJQUN4RCw4REFBb0QsQ0FBQTtJQUNwRCw2Q0FBbUMsQ0FBQTtJQUNuQyxtREFBeUMsQ0FBQTtJQUN6QyxzREFBNEMsQ0FBQTtBQUNoRCxDQUFDLEVBYlcsTUFBTSxLQUFOLE1BQU0sUUFhakI7QUFFRCxNQUFNLENBQU4sSUFBWSxTQXlDWDtBQXpDRCxXQUFZLFNBQVM7SUFDakIsMERBQTZDLENBQUE7SUFDN0MsZ0RBQW1DLENBQUE7SUFDbkMsOENBQWlDLENBQUE7SUFDakMsa0RBQXFDLENBQUE7SUFDckMsOENBQWlDLENBQUE7SUFDakMsOENBQWlDLENBQUE7SUFDakMsd0NBQTJCLENBQUE7SUFDM0IsNERBQStDLENBQUE7SUFDL0Msb0RBQXVDLENBQUE7SUFDdkMsa0RBQXFDLENBQUE7SUFDckMsb0RBQXVDLENBQUE7SUFDdkMsOENBQWlDLENBQUE7SUFDakMsd0RBQTJDLENBQUE7SUFDM0MsMENBQTZCLENBQUE7SUFDN0IsOENBQWlDLENBQUE7SUFDakMsd0RBQTJDLENBQUE7SUFDM0Msc0RBQXlDLENBQUE7SUFDekMsc0NBQXlCLENBQUE7SUFDekIsd0NBQTJCLENBQUE7SUFDM0IsZ0NBQW1CLENBQUE7SUFDbkIsa0RBQXFDLENBQUE7SUFDckMsb0RBQXVDLENBQUE7SUFDdkMsa0RBQXFDLENBQUE7SUFDckMsNENBQStCLENBQUE7SUFDL0Isa0RBQXFDLENBQUE7SUFDckMsZ0NBQW1CLENBQUE7SUFDbkIsa0NBQXFCLENBQUE7SUFDckIsZ0RBQW1DLENBQUE7SUFDbkMsc0RBQXlDLENBQUE7SUFDekMsZ0RBQW1DLENBQUE7SUFDbkMsc0NBQXlCLENBQUE7SUFDekIsOENBQWlDLENBQUE7SUFDakMsOENBQWlDLENBQUE7SUFDakMsMENBQTZCLENBQUE7SUFDN0IsZ0RBQW1DLENBQUE7SUFDbkMsa0RBQXFDLENBQUE7SUFDckMsd0RBQTJDLENBQUE7SUFDM0Msc0RBQXlDLENBQUE7SUFDekMsOENBQWlDLENBQUE7SUFDakMsNENBQStCLENBQUE7QUFDbkMsQ0FBQyxFQXpDVyxTQUFTLEtBQVQsU0FBUyxRQXlDcEI7QUFBQSxDQUFDO0FBQ0Y7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQU4sSUFBWSxjQUdYO0FBSEQsV0FBWSxjQUFjO0lBQ3RCLHlEQUFvQixDQUFBO0lBQ3BCLDZFQUE4QixDQUFBO0FBQ2xDLENBQUMsRUFIVyxjQUFjLEtBQWQsY0FBYyxRQUd6QjtBQUFBLENBQUM7QUFFRixNQUFNLENBQU4sSUFBWSxZQVFYO0FBUkQsV0FBWSxZQUFZO0lBQ3BCLDJDQUEyQixDQUFBO0lBQzNCLG9EQUFvQyxDQUFBO0lBQ3BDLGdFQUFnRCxDQUFBO0lBQ2hELDREQUE0QyxDQUFBO0lBQzVDLHNEQUFzQyxDQUFBO0lBQ3RDLHVEQUF1QyxDQUFBO0lBQ3ZDLGtEQUFrQyxDQUFBO0FBQ3RDLENBQUMsRUFSVyxZQUFZLEtBQVosWUFBWSxRQVF2QjtBQUFBLENBQUM7QUFFRixNQUFNLENBQU4sSUFBWSxhQUlYO0FBSkQsV0FBWSxhQUFhO0lBQ3JCLHdDQUF1QixDQUFBO0lBQ3ZCLG9EQUFtQyxDQUFBO0lBQ25DLHNDQUFxQixDQUFBO0FBQ3pCLENBQUMsRUFKVyxhQUFhLEtBQWIsYUFBYSxRQUl4QjtBQUFBLENBQUM7QUFFRixNQUFNLENBQU4sSUFBWSxNQW9IWDtBQXBIRCxXQUFZLE1BQU07SUFDZDs7OztPQUlHO0lBQ0gsbUNBQWlCLENBQUE7SUFDakI7Ozs7T0FJRztJQUNILHlDQUFvQixDQUFBO0lBQ3BCOzs7O09BSUc7SUFDSCxtREFBeUIsQ0FBQTtJQUN6Qjs7OztPQUlHO0lBQ0gsNkRBQThCLENBQUE7SUFDOUI7Ozs7O09BS0c7SUFDSCxpRkFBd0MsQ0FBQTtJQUN4Qzs7OztPQUlHO0lBQ0gsd0NBQW1CLENBQUE7SUFDbkI7Ozs7T0FJRztJQUNILGtFQUFnQyxDQUFBO0lBQ2hDOzs7O09BSUc7SUFDSCw4REFBOEIsQ0FBQTtJQUM5Qjs7OztPQUlHO0lBQ0gscUVBQWlDLENBQUE7SUFDakM7Ozs7T0FJRztJQUNILCtDQUFzQixDQUFBO0lBQ3RCOzs7O09BSUc7SUFDSCxtREFBd0IsQ0FBQTtJQUN4Qjs7OztPQUlHO0lBQ0gsNENBQW9CLENBQUE7SUFDcEI7Ozs7T0FJRztJQUNILGtEQUF1QixDQUFBO0lBQ3ZCOzs7O09BSUc7SUFDSCxrREFBd0IsQ0FBQTtJQUN4Qjs7OztPQUlHO0lBQ0gsMENBQW9CLENBQUE7SUFDcEI7Ozs7T0FJRztJQUNILHFEQUF5QixDQUFBO0lBQ3pCOzs7O09BSUc7SUFDSCx1Q0FBa0IsQ0FBQTtJQUNsQjs7OztPQUlHO0lBQ0gscURBQXlCLENBQUE7SUFDekI7Ozs7T0FJRztJQUNILHNDQUFpQixDQUFBO0FBQ3JCLENBQUMsRUFwSFcsTUFBTSxLQUFOLE1BQU0sUUFvSGpCIn0=