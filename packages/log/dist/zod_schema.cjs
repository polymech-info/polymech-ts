var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var zod_schema_exports = {};
__export(zod_schema_exports, {
  LogLevelEx: () => LogLevelEx,
  TLogLevelNameSchema: () => TLogLevelNameSchema
});
module.exports = __toCommonJS(zod_schema_exports);
var import_zod = require("zod");
const TLogLevelNameSchema = import_zod.z.enum(["silly", "trace", "debug", "info", "warn", "error", "fatal"]);
var LogLevelEx = /* @__PURE__ */ ((LogLevelEx2) => {
  LogLevelEx2[LogLevelEx2["silly"] = 0] = "silly";
  LogLevelEx2[LogLevelEx2["trace"] = 1] = "trace";
  LogLevelEx2[LogLevelEx2["debug"] = 2] = "debug";
  LogLevelEx2[LogLevelEx2["info"] = 3] = "info";
  LogLevelEx2[LogLevelEx2["warn"] = 4] = "warn";
  LogLevelEx2[LogLevelEx2["error"] = 5] = "error";
  LogLevelEx2[LogLevelEx2["fatal"] = 6] = "fatal";
  return LogLevelEx2;
})(LogLevelEx || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LogLevelEx,
  TLogLevelNameSchema
});
//# sourceMappingURL=zod_schema.cjs.map