import { z } from "zod";
const TLogLevelNameSchema = z.enum(["silly", "trace", "debug", "info", "warn", "error", "fatal"]);
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
export {
  LogLevelEx,
  TLogLevelNameSchema
};
//# sourceMappingURL=zod_schema.js.map