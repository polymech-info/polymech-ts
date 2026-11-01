"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.targets = void 0;
const path = require("path");
const bluebird_1 = require("bluebird");
const exists_1 = require("@plastichub/fs/exists");
const write_1 = require("@plastichub/fs/write");
const osr_commons_1 = require("@plastichub/osr-commons");
const Engine_1 = require("../Engine");
const options_1 = require("../options");
const index_1 = require("../index");
const _cli_1 = require("../_cli");
const zod_schema_1 = require("../zod_schema");
let options = (yargs) => (0, _cli_1.defaultOptions)(yargs);
function _compile(options) {
    return __awaiter(this, void 0, void 0, function* () {
        let engineOptions = Object.assign({ root: [
                ...options.profile.includes
            ] }, options);
        if (options.dry) {
            return;
        }
        let engine = new Engine_1.Engine(engineOptions);
        options.source = path.resolve(options.source);
        index_1.logger.info(`\n\nCompile ${options.source}`);
        let output = yield engine.render(options.source, options.variables);
        if (!output) {
            index_1.logger.error(`Error compiling ${options.source} : invalid output`);
            return false;
        }
        output = output.trim();
        if (!options.output && options.stdout) {
            process.stdout.write(output);
        }
        else {
            (0, write_1.sync)(options.output, output);
        }
        const outputPath = path.resolve(options.output);
        options.output && index_1.logger.info(`\n\nWriting output to ${outputPath}`);
    });
}
const clone = (obj) => {
    if (null == obj || "object" != typeof obj)
        return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr))
            copy[attr] = obj[attr];
    }
    return copy;
};
const targets = (f, options) => {
    const srcParts = path.parse(f);
    const variables = clone(options.pathVariables);
    const targets = [];
    variables.SRC_NAME = srcParts.name;
    variables.SRC_DIR = srcParts.dir;
    variables.SRC_EXT = srcParts.ext;
    if (variables.ROOT) {
        variables.SRC_REL = path.relative(variables.ROOT, srcParts.dir);
    }
    if (options.targetInfo.IS_GLOB) {
        options.targetInfo.GLOB_EXTENSIONS.forEach((e) => {
            variables.SRC_NAME = srcParts.name;
            variables.SRC_DIR = srcParts.dir;
            let targetPath = (0, index_1.substitute)(options.alt, options.pathVariables.DST_PATH, variables);
            targetPath = path.resolve(targetPath.replace(options.pathVariables.DST_FILE_EXT, '') + e);
            targets.push(targetPath);
        });
    }
    else {
        let targetPath = (0, index_1.substitute)(options.alt, options.pathVariables.DST_PATH, variables);
        targets.push(targetPath);
    }
    return targets;
};
exports.targets = targets;
function compile(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options.srcInfo) {
            return yield bluebird_1.Promise.resolve(options.srcInfo.FILES).map((f) => {
                const outputs = (0, exports.targets)(f, options);
                return _compile(Object.assign(Object.assign({}, options), { source: f, output: outputs[0] }));
            }, { concurrency: 1 });
        }
        else {
            return _compile(options);
        }
    });
}
const register = (cli) => {
    return cli.command('compile', 'Compiles input files', options, (argv) => __awaiter(void 0, void 0, void 0, function* () {
        if (argv.help) {
            return;
        }
        let options = (0, _cli_1.sanitize)(argv);
        if (!options) {
            return;
        }
        options = (0, zod_schema_1.compilerOptions)().parse(options);
        options = (0, options_1.parse)(options, argv);
        let variables = Object.assign({}, ...Object.keys(argv).filter((k) => k.startsWith('var-')).map((k) => {
            return {
                [k.replace('var-', '')]: argv[k]
            };
        }));
        options.variables = Object.assign(Object.assign(Object.assign(Object.assign({}, options.variables), variables), (0, osr_commons_1.DATE_VARS)()), {
            model: argv.model
        });
        index_1.logger.settings.minLevel = options.logLevel;
        if (options.source && !options.srcInfo) {
            if (!(0, exists_1.sync)(options.source)) {
                index_1.logger.error(`Invalid source file, doesn't exists: ${options.source} `);
                return;
            }
        }
        if (options.dry) {
            index_1.logger.info(`Abort : Dry enabled`);
            return;
        }
        index_1.logger.debug(`Compile with options`, options);
        yield compile(options);
    }));
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kcy9jb21waWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLDZCQUE0QjtBQUM1Qix1Q0FBOEM7QUFFOUMsa0RBQXNEO0FBQ3RELGdEQUFvRDtBQUNwRCx5REFBbUQ7QUFDbkQsc0NBQWtDO0FBQ2xDLHdDQUFrQztBQUNsQyxvQ0FBNkM7QUFDN0Msa0NBQWtEO0FBRWxELDhDQUErQztBQUUvQyxJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsSUFBQSxxQkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFBO0FBRXhELFNBQWUsUUFBUSxDQUFDLE9BQWlCOztRQUNyQyxJQUFJLGFBQWEsbUJBQ2IsSUFBSSxFQUFFO2dCQUNGLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRO2FBQzlCLElBQ0UsT0FBTyxDQUNiLENBQUE7UUFDRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDYixPQUFNO1NBQ1Q7UUFFRCxJQUFJLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUN0QyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzdDLGNBQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQTtRQUM1QyxJQUFJLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDbkUsSUFBRyxDQUFDLE1BQU0sRUFBQztZQUNQLGNBQU0sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLE9BQU8sQ0FBQyxNQUFNLG1CQUFtQixDQUFDLENBQUE7WUFDbEUsT0FBTyxLQUFLLENBQUE7U0FDZjtRQUVELE1BQU0sR0FB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