var a = Object.defineProperty;
var o = (i, e, t) => e in i ? a(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var r = (i, e, t) => o(i, typeof e != "symbol" ? e + "" : e, t);
import { H as d, d as p, e as u } from "./lib-export-CI8auKfP.js";
import "react";
class y extends d {
  constructor(t, s) {
    super(t, s);
    r(this, "$$PROVIDER_TYPE", "AUDIO");
    r(this, "airPlay");
    p(() => {
      this.airPlay = new u(this.media, s);
    }, this.scope);
  }
  get type() {
    return "audio";
  }
  setup() {
    super.setup(), this.type === "audio" && this.ctx.notify("provider-setup", this);
  }
  /**
   * The native HTML `<audio>` element.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement}
   */
  get audio() {
    return this.media;
  }
}
export {
  y as AudioProvider
};
//# sourceMappingURL=vidstack-R_ot4AhB-HEsIT7bU.js.map
