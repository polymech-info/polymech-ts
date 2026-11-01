"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterToken = void 0;
const token_1 = require("./token");
const token_kind_1 = require("../parser/token-kind");
class FilterToken extends token_1.Token {
    constructor(name, args, input, begin, end, file) {
        super(token_kind_1.TokenKind.Filter, input, begin, end, file);
        this.name = name;
        this.args = args;
    }
}
exports.FilterToken = FilterToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVyLXRva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3Rva2Vucy9maWx0ZXItdG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQStCO0FBRS9CLHFEQUFnRDtBQUVoRCxNQUFhLFdBQVksU0FBUSxhQUFLO0lBQ3BDLFlBQ1MsSUFBWSxFQUNaLElBQWlCLEVBQ3hCLEtBQWEsRUFDYixLQUFhLEVBQ2IsR0FBVyxFQUNYLElBQWE7UUFFYixLQUFLLENBQUMsc0JBQVMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFQekMsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLFNBQUksR0FBSixJQUFJLENBQWE7SUFPMUIsQ0FBQztDQUNGO0FBWEQsa0NBV0MifQ==