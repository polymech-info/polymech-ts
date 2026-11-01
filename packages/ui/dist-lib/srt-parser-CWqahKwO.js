import { V as c, a as i, b as a } from "./prod-DTLJXtPo.js";
const n = /,/g, u = "-->";
class o extends c {
  parse(s, e) {
    var h, r;
    if (s === "")
      this.c && (this.l.push(this.c), (r = (h = this.h).onCue) == null || r.call(h, this.c), this.c = null), this.e = i.None;
    else if (this.e === i.Cue)
      this.c.text += (this.c.text ? `
` : "") + s;
    else if (s.includes(u)) {
      const t = this.q(s, e);
      t && (this.c = new a(t[0], t[1], t[2].join(" ")), this.c.id = this.n, this.e = i.Cue);
    }
    this.n = s;
  }
  q(s, e) {
    return super.q(s.replace(n, "."), e);
  }
}
function l() {
  return new o();
}
export {
  o as SRTParser,
  l as default
};
//# sourceMappingURL=srt-parser-CWqahKwO.js.map
