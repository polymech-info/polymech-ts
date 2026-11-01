/**
 * Flags to describe a block's execution behavior.
 *
 * @enum {integer} module=xide/types/RUN_FLAGS
 * @memberOf module=xide/types
 */
export declare enum RUN_FLAGS {
    /**
     * The block can execute child blocks.
     * @constant
     * @type int
     */
    CHILDREN = 32,
    /**
     * Block is waiting for a message => EXECUTION_STATE==RUNNING
     * @constant
     * @type int
     */
    WAIT = 32768
}
/**
 * Flags to describe a block's execution state.
 *
 * @enum {integer} module=xide/types/EXECUTION_STATE
 * @memberOf module=xide/types
 */
export declare enum EXECUTION_STATE {
    /**
     * The block is doing nothing and also has done nothing. The is the default state
     * @constant
     * @type int
     */
    NONE = 0,
    /**
     * The block is running.
     * @constant
     * @type int
     */
    RUNNING = 1,
    /**
     * The block is an error state.
     * @constant
     * @type int
     */
    ERROR = 2,
    /**
     * The block is in an paused state.
     * @constant
     * @type int
     */
    PAUSED = 4,
    /**
     * The block is an finished state, ready to be cleared to "NONE" at the next frame.
     * @constant
     * @type int
     */
    FINISH = 8,
    /**
     * The block is an stopped state, ready to be cleared to "NONE" at the next frame.
     * @constant
     * @type int
     */
    STOPPED = 16,
    /**
     * The block has been launched once...
     * @constant
     * @type int
     */
    ONCE = 2147483648,
    /**
     * Block will be reseted next frame
     * @constant
     * @type int
     */
    RESET_NEXT_FRAME = 8388608,
    /**
     * Block is locked and so no further inputs can be activated.
     * @constant
     * @type int
     */
    LOCKED = 536870912
}
export declare enum BLOCK_MODE {
    NORMAL = 0,
    UPDATE_WIDGET_PROPERTY = 1
}
/**
 * Flags to describe a block's belonging to a standard signal.
 * @enum {integer} module=xblox/types/BLOCK_OUTLET
 * @memberOf module=xblox/types
 */
export declare enum BLOCK_OUTLET {
    NONE = 0,
    PROGRESS = 1,
    ERROR = 2,
    PAUSED = 4,
    FINISH = 8,
    STOPPED = 16
}
export declare enum EVENTS {
    ON_RUN_BLOCK = "onRunBlock",
    ON_RUN_BLOCK_FAILED = "onRunBlockFailed",
    ON_RUN_BLOCK_SUCCESS = "onRunBlockSuccess",
    ON_BLOCK_SELECTED = "onItemSelected",
    ON_BLOCK_UNSELECTED = "onBlockUnSelected",
    ON_BLOCK_EXPRESSION_FAILED = "onExpressionFailed",
    ON_BUILD_BLOCK_INFO_LIST = "onBuildBlockInfoList",
    ON_BUILD_BLOCK_INFO_LIST_END = "onBuildBlockInfoListEnd",
    ON_BLOCK_PROPERTY_CHANGED = "onBlockPropertyChanged",
    ON_SCOPE_CREATED = "onScopeCreated",
    ON_VARIABLE_CHANGED = "onVariableChanged",
    ON_CREATE_VARIABLE_CI = "onCreateVariableCI"
}
export declare enum BlockType {
    AssignmentExpression = "AssignmentExpression",
    ArrayExpression = "ArrayExpression",
    BlockStatement = "BlockStatement",
    BinaryExpression = "BinaryExpression",
    BreakStatement = "BreakStatement",
    CallExpression = "CallExpression",
    CatchClause = "CatchClause",
    ConditionalExpression = "ConditionalExpression",
    ContinueStatement = "ContinueStatement",
    DoWhileStatement = "DoWhileStatement",
    DebuggerStatement = "DebuggerStatement",
    EmptyStatement = "EmptyStatement",
    ExpressionStatement = "ExpressionStatement",
    ForStatement = "ForStatement",
    ForInStatement = "ForInStatement",
    FunctionDeclaration = "FunctionDeclaration",
    FunctionExpression = "FunctionExpression",
    Identifier = "Identifier",
    IfStatement = "IfStatement",
    Literal = "Literal",
    LabeledStatement = "LabeledStatement",
    LogicalExpression = "LogicalExpression",
    MemberExpression = "MemberExpression",
    NewExpression = "NewExpression",
    ObjectExpression = "ObjectExpression",
    Program = "Program",
    Property = "Property",
    ReturnStatement = "ReturnStatement",
    SequenceExpression = "SequenceExpression",
    SwitchStatement = "SwitchStatement",
    SwitchCase = "SwitchCase",
    ThisExpression = "ThisExpression",
    ThrowStatement = "ThrowStatement",
    TryStatement = "TryStatement",
    UnaryExpression = "UnaryExpression",
    UpdateExpression = "UpdateExpression",
    VariableDeclaration = "VariableDeclaration",
    VariableDeclarator = "VariableDeclarator",
    WhileStatement = "WhileStatement",
    WithStatement = "WithStatement"
}
/**
 * Variable Flags
 *
 * @enum {int} VARIABLE_FLAGS
 * @global
 */
export declare enum VARIABLE_FLAGS {
    PUBLISH = 2,
    PUBLISH_IF_SERVER = 4
}
export declare enum BLOCK_GROUPS {
    VARIABLE = "DriverVariable",
    BASIC_COMMAND = "DriverBasicCommand",
    CONDITIONAL_COMMAND = "DriverConditionalCommand",
    RESPONSE_VARIABLE = "DriverResponseVariable",
    RESPONSE_BLOCKS = "conditionalProcess",
    RESPONSE_VARIABLES = "processVariables",
    BASIC_VARIABLES = "basicVariables"
}
export declare enum COMMAND_TYPES {
    BASIC_COMMAND = "basic",
    CONDITIONAL_COMMAND = "conditional",
    INIT_COMMAND = "init"
}
export declare enum CIFLAG {
    /**
     * Instruct for no additional extra processing
     * @constant
     * @type int
     */
    NONE = 0,
    /**
     * Will instruct the pre/post processor to base-64 decode or encode
     * @constant
     * @type int
     */
    BASE_64 = 1,
    /**
     * Post/Pre process the value with a user function
     * @constant
     * @type int
     */
    USE_FUNCTION = 2,
    /**
     * Replace variables with local scope's variables during the post/pre process
     * @constant
     * @type int
     */
    REPLACE_VARIABLES = 4,
    /**
     * Replace variables with local scope's variables during the post/pre process but evaluate the whole string
     * as Javascript
     * @constant
     * @type int
     */
    REPLACE_VARIABLES_EVALUATED = 8,
    /**
     * Will instruct the pre/post processor to escpape evaluated or replaced variables or expressions
     * @constant
     * @type int
     */
    ESCAPE = 16,
    /**
     * Will instruct the pre/post processor to replace block calls with oridinary vanilla script
     * @constant
     * @type int
     */
    REPLACE_BLOCK_CALLS = 32,
    /**
     * Will instruct the pre/post processor to remove variable delimitters/placeholders from the final string
     * @constant
     * @type int
     */
    REMOVE_DELIMTTERS = 64,
    /**
     * Will instruct the pre/post processor to remove   "[" ,"]" , "(" , ")" , "{", "}" , "*" , "+" , "."
     * @constant
     * @type int
     */
    ESCAPE_SPECIAL_CHARS = 128,
    /**
     * Will instruct the pre/post processor to use regular expressions over string substitution
     * @constant
     * @type int
     */
    USE_REGEX = 256,
    /**
     * Will instruct the pre/post processor to use Filtrex (custom bison parser, needs xexpression) over string substitution
     * @constant
     * @type int
     */
    USE_FILTREX = 512,
    /**
     * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
     * @constant
     * @type int
     */
    CASCADE = 1024,
    /**
     * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
     * @constant
     * @type int
     */
    EXPRESSION = 2048,
    /**
     * Dont parse anything
     * @constant
     * @type int
     */
    DONT_PARSE = 4096,
    /**
     * Convert to hex
     * @constant
     * @type int
     */
    TO_HEX = 8192,
    /**
     * Convert to hex
     * @constant
     * @type int
     */
    REPLACE_HEX = 16384,
    /**
     * Wait for finish
     * @constant
     * @type int
     */
    WAIT = 32768,
    /**
     * Wait for finish
     * @constant
     * @type int
     */
    DONT_ESCAPE = 65536,
    /**
     * Flag to mark the maximum core bit mask, after here its user land
     * @constant
     * @type int
     */
    END = 131072
}
