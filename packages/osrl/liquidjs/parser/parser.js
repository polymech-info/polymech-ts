"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("../util/error");
const liquid_1 = require("../liquid");
const parse_stream_1 = require("./parse-stream");
const type_guards_1 = require("../util/type-guards");
const tag_1 = require("../template/tag/tag");
const output_1 = require("../template/output");
const html_1 = require("../template/html");
const loader_1 = require("../fs/loader");
const async_1 = require("../util/async");
class Parser {
    constructor(liquid) {
        this.liquid = liquid;
        this.cache = this.liquid.options.cache;
        this.fs = this.liquid.options.fs;
        this.parseFile = this.cache ? this._parseFileCached : this._parseFile;
        this.loader = new loader_1.Loader(this.liquid.options);
    }
    parse(html, filepath) {
        const tokenizer = new liquid_1.Tokenizer(html, this.liquid.options.operatorsTrie, filepath);
        const tokens = tokenizer.readTopLevelTokens(this.liquid.options);
        return this.parseTokens(tokens);
    }
    parseTokens(tokens) {
        let token;
        const templates = [];
        while ((token = tokens.shift())) {
            templates.push(this.parseToken(token, tokens));
        }
        return templates;
    }
    parseToken(token, remainTokens) {
        try {
            if ((0, type_guards_1.isTagToken)(token)) {
                return new tag_1.Tag(token, remainTokens, this.liquid);
            }
            if ((0, type_guards_1.isOutputToken)(token)) {
                return new output_1.Output(token, this.liquid);
            }
            return new html_1.HTML(token);
        }
        catch (e) {
            throw new error_1.ParseError(e, token);
        }
    }
    parseStream(tokens) {
        return new parse_stream_1.ParseStream(tokens, (token, tokens) => this.parseToken(token, tokens));
    }
    *_parseFileCached(file, sync, type = loader_1.LookupType.Root, currentFile) {
        const cache = this.cache;
        const key = this.loader.shouldLoadRelative(file) ? currentFile + ',' + file : type + ':' + file;
        const tpls = yield cache.read(key);
        if (tpls)
            return tpls;
        const task = this._parseFile(file, sync, type, currentFile);
        // sync mode: exec the task and cache the result
        // async mode: cache the task before exec
        const taskOrTpl = sync ? yield task : (0, async_1.toPromise)(task);
        cache.write(key, taskOrTpl);
        // note: concurrent tasks will be reused, cache for failed task is removed until its end
        try {
            return yield taskOrTpl;
        }
        catch (err) {
            cache.remove(key);
            throw err;
        }
    }
    *_parseFile(file, sync, type = loader_1.LookupType.Root, currentFile) {
        const filepath = yield this.loader.lookup(file, type, sync, currentFile);
        return this.liquid.parse(sync ? this.fs.readFileSync(filepath) : yield this.fs.readFile(filepath), filepath);
    }
}
exports.default = Parser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3BhcnNlci9wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBMEM7QUFDMUMsc0NBQTZDO0FBQzdDLGlEQUE0QztBQUM1QyxxREFBK0Q7QUFFL0QsNkNBQXlDO0FBQ3pDLCtDQUEyQztBQUMzQywyQ0FBdUM7QUFJdkMseUNBQWlEO0FBQ2pELHlDQUF5QztBQUd6QyxNQUFxQixNQUFNO0lBUXpCLFlBQW9CLE1BQWM7UUFDaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7UUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUE7UUFDdEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUE7UUFDaEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUE7UUFDckUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQy9DLENBQUM7SUFDTSxLQUFLLENBQUUsSUFBWSxFQUFFLFFBQWlCO1FBQzNDLE1BQU0sU0FBUyxHQUFHLElBQUksa0JBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ2xGLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2hFLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNqQyxD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