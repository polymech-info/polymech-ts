import * as CLI from 'yargs';
export declare const command = "schemas";
export declare const desc = "Generate schema files (schemas.json and schema_ui.json)";
export declare const builder: (yargs: CLI.Argv) => any;
export declare function handler(argv: CLI.Arguments): Promise<void>;
