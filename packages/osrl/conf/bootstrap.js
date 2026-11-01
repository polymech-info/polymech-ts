"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.context = void 0;
const path = require("path");
const index_1 = require("../lib/index");
const __1 = require("../");
const StringUtils = require("../lib/StringUtils");
const HexUtils = require("../lib/HexUtils");
const Arrays = require("../lib/arrays");
const Primitives = require("../lib/primitives");
const markdown_1 = require("../lib/markdown");
const fm = require("front-matter");
const fs_1 = require("../lib/fs");
const osr_commons_1 = require("@plastichub/osr-commons");
const iterator_1 = require("@plastichub/fs/iterator");
const exists_1 = require("@plastichub/fs/exists");
const write_1 = require("@plastichub/fs/write");
const read_1 = require("@plastichub/fs/read");
const osr_commons_2 = require("@plastichub/osr-commons");
const env = require("env-var");
const os = require("os");
const fs = require("fs");
const crypto = require("crypto");
const cheerio = require("cheerio");
const bluebird_1 = require("bluebird");
const cacache = require("cacache");
const js_beautify_1 = require("js-beautify");
const convert = require('convert-units');
const fg = require('fast-glob');
const findUp = require('find-up');
const hljs = require('highlight.js');
const prettyHtml = require('json-pretty-html').default;
const prettyJSON = require('json-format-highlight');
const TOML = require('@iarna/toml');
const TOMLParser = require('@iarna/toml/lib/toml-parser.js');
const xlsx = require('node-xlsx');
const YAML = require('json-to-pretty-yaml');
exports.context = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ convert: convert }, StringUtils), HexUtils), Arrays), Primitives), { markdownTable: markdown_1.markdownTable,
    md2html: markdown_1.md2html,
    cacache,
    cheerio,
    logger: __1.logger, config: (0, osr_commons_1.CONFIG_DEFAULT)(), PATHS: osr_commons_1.DEFAULT_ROOTS, TOML: {
        parse: TOML.parse,
        stringify: TOML.stringify,
        parser: TOMLParser
    }, frontmatter: fm, YAML,
    resolveConfig: index_1.resolveConfig,
    prettyHtml,
    prettyJSON,
    html_beautify: js_beautify_1.html_beautify,
    BPromise: bluebird_1.Promise,
    hljs, xlsx: {
        build: xlsx.build,
        parse: xlsx.parse
    }, path, fs: Object.assign(Object.assign({ findUp: findUp, iterator: iterator_1.sync, glob: fg, slash: fs_1.forward_slash, EIteratorFlags: {
            MODE: 2,
            TIMES: 4,
            SYMLINKS: 8,
            FILE_SIZE: 16,
            DIRECTORY_SIZE: 32,
            CHECKSUM: 64,
            MIME: 128
        }, sizeToString: fs_1.sizeToString, dir: (dir, glob) => fg.sync(glob, { dot: true, cwd: dir, absolute: true }) }, fs), { path,
        exists: exists_1.sync,
        resolve: osr_commons_2.resolve,
        write: write_1.sync, read: read_1.sync }), os: Object.assign({ env: env }, os), crypto: Object.assign(Object.assign({}, crypto), { encrypt: (text, password, algorithm = 'aes-256-cbc') => {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, password, iv);
            let crypted = cipher.update(text, 'utf8', 'hex');
            crypted += cipher.final('hex');
            return crypted;
        }, decrypt: (text, password, algorithm = 'aes-128-ecb') => {
            const iv = crypto.randomBytes(16);
            const decipher = crypto.createCipheriv(algorithm, password, iv);
            let dec = decipher.update(text, 'hex', 'utf8');
            dec += decipher.final('utf8');
            return dec;
        } }) });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vdHN0cmFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmYvYm9vdHN0cmFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE0QjtBQUM1Qix3Q0FBNEM7QUFDNUMsMkJBQTRCO0FBQzVCLGtEQUFpRDtBQUNqRCw0Q0FBMkM7QUFDM0Msd0NBQXVDO0FBQ3ZDLGdEQUErQztBQUMvQyw4Q0FBd0Q7QUFDeEQsbUNBQWtDO0FBQ2xDLGtDQUF1RDtBQUN2RCx5REFBdUU7QUFFdkUsc0RBQTBEO0FBQzFELGtEQUFzRDtBQUN0RCxnREFBb0Q7QUFDcEQsOENBQWtEO0FBRWxELHlEQUFpRDtBQUdqRCwrQkFBK0I7QUFDL0IseUJBQXdCO0FBQ3hCLHlCQUF3QjtBQUN4QixpQ0FBZ0M7QUFDaEMsbUNBQWtDO0FBQ2xDLHVDQUE4QztBQUM5QyxtQ0FBa0M7QUFDbEMsNkNBQTJDO0FBRTNDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQTtBQUN4QyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7QUFDL0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ2pDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUNwQyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxPQUFPLENBQUE7QUFDdEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUE7QUFDbkQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ25DLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFBO0FBQzVELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUNqQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMs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