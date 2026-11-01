import { Logger } from "tslog";
var ELogTargets = /* @__PURE__ */ ((ELogTargets2) => {
  ELogTargets2[ELogTargets2["Console"] = 1] = "Console";
  ELogTargets2[ELogTargets2["FileText"] = 2] = "FileText";
  ELogTargets2[ELogTargets2["FileJson"] = 4] = "FileJson";
  ELogTargets2[ELogTargets2["Seq"] = 8] = "Seq";
  return ELogTargets2;
})(ELogTargets || {});
function createLogger(name, options) {
  return new Logger({
    name,
    type: "pretty",
    ...options
  });
}
export {
  ELogTargets,
  createLogger
};
//# sourceMappingURL=index.js.map