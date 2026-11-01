var k = Object.defineProperty;
var w = (t) => {
  throw TypeError(t);
};
var A = (t, e, a) => e in t ? k(t, e, { enumerable: !0, configurable: !0, writable: !0, value: a }) : t[e] = a;
var u = (t, e, a) => A(t, typeof e != "symbol" ? e + "" : e, a), C = (t, e, a) => e.has(t) || w("Cannot " + a);
var c = (t, e, a) => (C(t, e, "read from private field"), a ? a.call(t) : e.get(t)), m = (t, e, a) => e.has(t) ? w("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, a), E = (t, e, a, o) => (C(t, e, "write to private field"), o ? o.call(t, a) : e.set(t, a), a), s = (t, e, a) => (C(t, e, "access private method"), a);
import { m as P, I as O, K as R, M as b, l as D, J as G, v as L } from "./lib-export-CI8auKfP.js";
function M() {
  return "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
}
function N() {
  var t;
  return !!((t = window.cast) != null && t.framework);
}
function F() {
  var t, e;
  return !!((e = (t = window.chrome) == null ? void 0 : t.cast) != null && e.isAvailable);
}
function v() {
  return g().getCastState() === cast.framework.CastState.CONNECTED;
}
function g() {
  return window.cast.framework.CastContext.getInstance();
}
function y() {
  return g().getCurrentSession();
}
function T() {
  var t;
  return (t = y()) == null ? void 0 : t.getSessionObj().media[0];
}
function z(t) {
  var a;
  return ((a = T()) == null ? void 0 : a.media.contentId) === (t == null ? void 0 : t.src);
}
function U() {
  return {
    language: "en-US",
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    resumeSavedSession: !0,
    androidReceiverCompatible: !0
  };
}
function j(t) {
  return `Google Cast Error Code: ${t}`;
}
function q(t, e) {
  return P(g(), t, e);
}
var n, r, S, I, _, l, d;
class J {
  constructor() {
    m(this, r);
    u(this, "name", "google-cast");
    u(this, "target");
    m(this, n);
  }
  /**
   * @see {@link https://developers.google.com/cast/docs/reference/web_sender/cast.framework.CastContext}
   */
  get cast() {
    return g();
  }
  mediaType() {
    return "video";
  }
  canPlay(e) {
    return O && !b && R(e);
  }
  async prompt(e) {
    var h;
    let a, o, i;
    try {
      a = await s(this, r, S).call(this, e), c(this, n) || (E(this, n, new cast.framework.RemotePlayer()), new cast.framework.RemotePlayerController(c(this, n))), o = e.player.createEvent("google-cast-prompt-open", {
        trigger: a
      }), e.player.dispatchEvent(o), s(this, r, l).call(this, e, "connecting", o), await s(this, r, I).call(this, D(e.$props.googleCast)), e.$state.remotePlaybackInfo.set({
        deviceName: (h = y()) == null ? void 0 : h.getCastDevice().friendlyName
      }), v() && s(this, r, l).call(this, e, "connected", o);
    } catch (p) {
      const f = p instanceof Error ? p : s(this, r, d).call(this, (p + "").toUpperCase(), "Prompt failed.");
      throw i = e.player.createEvent("google-cast-prompt-error", {
        detail: f,
        trigger: o ?? a,
        cancelable: !0
      }), e.player.dispatch(i), s(this, r, l).call(this, e, v() ? "connected" : "disconnected", i), f;
    } finally {
      e.player.dispatch("google-cast-prompt-close", {
        trigger: i ?? o ?? a
      });
    }
  }
  async load(e) {
    if (G)
      throw Error("[vidstack] can not load google cast provider server-side");
    if (!c(this, n))
      throw Error("[vidstack] google cast player was not initialized");
    return new (await import("./vidstack-BeT6vBOi-DhlHLgwc.js")).GoogleCastProvider(c(this, n), e);
  }
}
n = new WeakMap(), r = new WeakSet(), S = async function(e) {
  if (N()) return;
  const a = e.player.createEvent("google-cast-load-start");
  e.player.dispatch(a), await L(M()), await customElements.whenDefined("google-cast-launcher");
  const o = e.player.createEvent("google-cast-loaded", { trigger: a });
  if (e.player.dispatch(o), !F())
    throw s(this, r, d).call(this, "CAST_NOT_AVAILABLE", "Google Cast not available on this platform.");
  return o;
}, I = async function(e) {
  s(this, r, _).call(this, e);
  const a = await this.cast.requestSession();
  if (a)
    throw s(this, r, d).call(this, a.toUpperCase(), j(a));
}, _ = function(e) {
  var a;
  (a = this.cast) == null || a.setOptions({
    ...U(),
    ...e
  });
}, l = function(e, a, o) {
  const i = { type: "google-cast", state: a };
  e.notify("remote-playback-change", i, o);
}, d = function(e, a) {
  const o = Error(a);
  return o.code = e, o;
};
var B = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  GoogleCastLoader: J
});
export {
  g as getCastContext,
  j as getCastErrorMessage,
  y as getCastSession,
  T as getCastSessionMedia,
  z as hasActiveCastSession,
  q as listenCastContextEvent,
  B as loader
};
//# sourceMappingURL=vidstack-CQQ1xKSy-CZZk6e1l.js.map
