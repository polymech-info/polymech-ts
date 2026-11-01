import { jsx as o, jsxs as u, Fragment as Yt } from "react/jsx-runtime";
import { Minus as Ht, Plus as Vt, Trash2 as St, ShoppingCart as Xe, Loader2 as Bt, ShoppingBag as Jt, MapPin as Ke, Save as Gt, CreditCard as Qe, Bitcoin as Xt, Truck as Kt, Clock as He, Globe as Qt, DollarSign as Zt, RotateCcw as er, CheckCircle as De, XCircle as Fe, RefreshCw as qe, Package as Ze, ArrowLeft as tr, Store as rr, ExternalLink as nr, Receipt as ar, FileText as or } from "lucide-react";
import * as L from "react";
import F, { useState as ae, useEffect as _e } from "react";
import { twMerge as ir } from "tailwind-merge";
import { create as sr } from "zustand";
import { persist as cr } from "zustand/middleware";
import "react-dom";
import { useLocation as lr, matchPath as ue } from "react-router-dom";
function et(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function ur(...e) {
  return (t) => {
    let r = !1;
    const n = e.map((a) => {
      const i = et(a, t);
      return !r && typeof i == "function" && (r = !0), i;
    });
    if (r)
      return () => {
        for (let a = 0; a < n.length; a++) {
          const i = n[a];
          typeof i == "function" ? i() : et(e[a], null);
        }
      };
  };
}
var dr = Symbol.for("react.lazy"), Re = L[" use ".trim().toString()];
function fr(e) {
  return typeof e == "object" && e !== null && "then" in e;
}
function Nt(e) {
  return e != null && typeof e == "object" && "$$typeof" in e && e.$$typeof === dr && "_payload" in e && fr(e._payload);
}
// @__NO_SIDE_EFFECTS__
function Ve(e) {
  const t = /* @__PURE__ */ mr(e), r = L.forwardRef((n, a) => {
    let { children: i, ...l } = n;
    Nt(i) && typeof Re == "function" && (i = Re(i._payload));
    const c = L.Children.toArray(i), s = c.find(yr);
    if (s) {
      const m = s.props.children, h = c.map((f) => f === s ? L.Children.count(m) > 1 ? L.Children.only(null) : L.isValidElement(m) ? m.props.children : null : f);
      return /* @__PURE__ */ o(t, { ...l, ref: a, children: L.isValidElement(m) ? L.cloneElement(m, void 0, h) : null });
    }
    return /* @__PURE__ */ o(t, { ...l, ref: a, children: i });
  });
  return r.displayName = `${e}.Slot`, r;
}
var pr = /* @__PURE__ */ Ve("Slot");
// @__NO_SIDE_EFFECTS__
function mr(e) {
  const t = L.forwardRef((r, n) => {
    let { children: a, ...i } = r;
    if (Nt(a) && typeof Re == "function" && (a = Re(a._payload)), L.isValidElement(a)) {
      const l = gr(a), c = vr(i, a.props);
      return a.type !== L.Fragment && (c.ref = n ? ur(n, l) : l), L.cloneElement(a, c);
    }
    return L.Children.count(a) > 1 ? L.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var hr = Symbol("radix.slottable");
function yr(e) {
  return L.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === hr;
}
function vr(e, t) {
  const r = { ...t };
  for (const n in t) {
    const a = e[n], i = t[n];
    /^on[A-Z]/.test(n) ? a && i ? r[n] = (...c) => {
      const s = i(...c);
      return a(...c), s;
    } : a && (r[n] = a) : n === "style" ? r[n] = { ...a, ...i } : n === "className" && (r[n] = [a, i].filter(Boolean).join(" "));
  }
  return { ...e, ...r };
}
function gr(e) {
  var n, a;
  let t = (n = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : n.get, r = t && "isReactWarning" in t && t.isReactWarning;
  return r ? e.ref : (t = (a = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : a.get, r = t && "isReactWarning" in t && t.isReactWarning, r ? e.props.ref : e.props.ref || e.ref);
}
function Ct(e) {
  var t, r, n = "";
  if (typeof e == "string" || typeof e == "number") n += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var a = e.length;
    for (t = 0; t < a; t++) e[t] && (r = Ct(e[t])) && (n && (n += " "), n += r);
  } else for (r in e) e[r] && (n && (n += " "), n += r);
  return n;
}
function Et() {
  for (var e, t, r = 0, n = "", a = arguments.length; r < a; r++) (e = arguments[r]) && (t = Ct(e)) && (n && (n += " "), n += t);
  return n;
}
const tt = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, rt = Et, Be = (e, t) => (r) => {
  var n;
  if ((t == null ? void 0 : t.variants) == null) return rt(e, r == null ? void 0 : r.class, r == null ? void 0 : r.className);
  const { variants: a, defaultVariants: i } = t, l = Object.keys(a).map((m) => {
    const h = r == null ? void 0 : r[m], f = i == null ? void 0 : i[m];
    if (h === null) return null;
    const g = tt(h) || tt(f);
    return a[m][g];
  }), c = r && Object.entries(r).reduce((m, h) => {
    let [f, g] = h;
    return g === void 0 || (m[f] = g), m;
  }, {}), s = t == null || (n = t.compoundVariants) === null || n === void 0 ? void 0 : n.reduce((m, h) => {
    let { class: f, className: g, ...w } = h;
    return Object.entries(w).every((j) => {
      let [N, I] = j;
      return Array.isArray(I) ? I.includes({
        ...i,
        ...c
      }[N]) : {
        ...i,
        ...c
      }[N] === I;
    }) ? [
      ...m,
      f,
      g
    ] : m;
  }, []);
  return rt(e, l, s, r == null ? void 0 : r.class, r == null ? void 0 : r.className);
};
function U(...e) {
  return ir(Et(e));
}
const br = Be(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-2",
        lg: "h-11 rounded-md px-4",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
), re = L.forwardRef(
  ({ className: e, variant: t, size: r, asChild: n = !1, ...a }, i) => /* @__PURE__ */ o(n ? pr : "button", { className: U(br({ variant: t, size: r, className: e })), ref: i, ...a })
);
re.displayName = "Button";
function Ne(e) {
  return {
    subtotal: e.reduce((t, r) => t + r.price * r.quantity, 0),
    itemCount: e.reduce((t, r) => t + r.quantity, 0)
  };
}
const se = sr()(
  cr(
    (e) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      addItem: (t) => e((r) => {
        const n = r.items.find((i) => i.id === t.id);
        let a;
        return n ? a = r.items.map(
          (i) => i.id === t.id ? { ...i, quantity: i.quantity + (t.quantity ?? 1) } : i
        ) : a = [...r.items, { ...t, quantity: t.quantity ?? 1 }], { items: a, ...Ne(a) };
      }),
      removeItem: (t) => e((r) => {
        const n = r.items.filter((a) => a.id !== t);
        return { items: n, ...Ne(n) };
      }),
      updateQuantity: (t, r) => e((n) => {
        if (r <= 0) {
          const i = n.items.filter((l) => l.id !== t);
          return { items: i, ...Ne(i) };
        }
        const a = n.items.map(
          (i) => i.id === t ? { ...i, quantity: r } : i
        );
        return { items: a, ...Ne(a) };
      }),
      clearCart: () => e({ items: [], subtotal: 0, itemCount: 0 })
    }),
    {
      name: "pm-ecommerce-cart"
    }
  )
);
function xr({ item: e, className: t }) {
  const r = se((i) => i.updateQuantity), n = se((i) => i.removeItem), a = e.price * e.quantity;
  return /* @__PURE__ */ u(
    "div",
    {
      className: U(
        "flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4 transition-colors hover:bg-accent/5",
        t
      ),
      children: [
        e.image ? /* @__PURE__ */ o(
          "img",
          {
            src: e.image,
            alt: e.title,
            className: "h-20 w-20 shrink-0 rounded-md object-cover"
          }
        ) : /* @__PURE__ */ o("div", { className: "flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground", children: "No img" }),
        /* @__PURE__ */ u("div", { className: "flex flex-1 flex-col gap-1 min-w-0", children: [
          /* @__PURE__ */ o("span", { className: "truncate font-medium", children: e.title }),
          e.variant && /* @__PURE__ */ o("span", { className: "text-xs text-muted-foreground", children: e.variant }),
          /* @__PURE__ */ u("span", { className: "text-sm text-muted-foreground", children: [
            "$",
            e.price.toFixed(2),
            " each"
          ] }),
          e.vendorSlug && /* @__PURE__ */ u(
            "a",
            {
              href: `/user/${e.vendorSlug}`,
              className: "text-xs text-primary hover:underline",
              children: [
                "Sold by ",
                e.vendorSlug
              ]
            }
          )
        ] }),
        /* @__PURE__ */ u("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ o(
            re,
            {
              variant: "outline",
              size: "icon",
              className: "h-8 w-8",
              onClick: () => r(e.id, e.quantity - 1),
              "aria-label": "Decrease quantity",
              children: /* @__PURE__ */ o(Ht, { className: "h-3 w-3" })
            }
          ),
          /* @__PURE__ */ o("span", { className: "w-8 text-center text-sm font-medium tabular-nums", children: e.quantity }),
          /* @__PURE__ */ o(
            re,
            {
              variant: "outline",
              size: "icon",
              className: "h-8 w-8",
              onClick: () => r(e.id, e.quantity + 1),
              "aria-label": "Increase quantity",
              children: /* @__PURE__ */ o(Vt, { className: "h-3 w-3" })
            }
          )
        ] }),
        /* @__PURE__ */ u("span", { className: "w-20 text-right font-semibold tabular-nums", children: [
          "$",
          a.toFixed(2)
        ] }),
        /* @__PURE__ */ o(
          re,
          {
            variant: "ghost",
            size: "icon",
            className: "h-8 w-8 text-destructive hover:text-destructive",
            onClick: () => n(e.id),
            "aria-label": `Remove ${e.title}`,
            children: /* @__PURE__ */ o(St, { className: "h-4 w-4" })
          }
        )
      ]
    }
  );
}
const de = L.forwardRef(({ className: e, ...t }, r) => /* @__PURE__ */ o("div", { ref: r, className: U("rounded-lg border bg-card text-card-foreground shadow-sm", e), ...t }));
de.displayName = "Card";
const me = L.forwardRef(
  ({ className: e, ...t }, r) => /* @__PURE__ */ o("div", { ref: r, className: U("flex flex-col space-y-1.5 p-6", e), ...t })
);
me.displayName = "CardHeader";
const he = L.forwardRef(
  ({ className: e, ...t }, r) => /* @__PURE__ */ o("h3", { ref: r, className: U("text-2xl font-semibold leading-none tracking-tight", e), ...t })
);
he.displayName = "CardTitle";
const wr = L.forwardRef(
  ({ className: e, ...t }, r) => /* @__PURE__ */ o("p", { ref: r, className: U("text-sm text-muted-foreground", e), ...t })
);
wr.displayName = "CardDescription";
const fe = L.forwardRef(
  ({ className: e, ...t }, r) => /* @__PURE__ */ o("div", { ref: r, className: U("p-6 pt-0", e), ...t })
);
fe.displayName = "CardContent";
const Pt = L.forwardRef(
  ({ className: e, ...t }, r) => /* @__PURE__ */ o("div", { ref: r, className: U("flex items-center p-6 pt-0", e), ...t })
);
Pt.displayName = "CardFooter";
var Sr = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], Nr = Sr.reduce((e, t) => {
  const r = /* @__PURE__ */ Ve(`Primitive.${t}`), n = L.forwardRef((a, i) => {
    const { asChild: l, ...c } = a, s = l ? r : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ o(s, { ...c, ref: i });
  });
  return n.displayName = `Primitive.${t}`, { ...e, [t]: n };
}, {}), Cr = "Separator", nt = "horizontal", Er = ["horizontal", "vertical"], _t = L.forwardRef((e, t) => {
  const { decorative: r, orientation: n = nt, ...a } = e, i = Pr(n) ? n : nt, c = r ? { role: "none" } : { "aria-orientation": i === "vertical" ? i : void 0, role: "separator" };
  return /* @__PURE__ */ o(
    Nr.div,
    {
      "data-orientation": i,
      ...c,
      ...a,
      ref: t
    }
  );
});
_t.displayName = Cr;
function Pr(e) {
  return Er.includes(e);
}
var Tt = _t;
const ye = L.forwardRef(({ className: e, orientation: t = "horizontal", decorative: r = !0, ...n }, a) => /* @__PURE__ */ o(
  Tt,
  {
    ref: a,
    decorative: r,
    orientation: t,
    className: U("shrink-0 bg-border", t === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", e),
    ...n
  }
));
ye.displayName = Tt.displayName;
const _r = [
  { label: "Returns & Refunds", href: "/returns" },
  { label: "Shipping", href: "/shipping" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" }
];
function kt({ links: e = _r, className: t }) {
  return /* @__PURE__ */ o("nav", { className: U("flex flex-wrap items-center justify-center gap-y-2 text-xs text-muted-foreground", t), children: e.map((r, n) => /* @__PURE__ */ u(F.Fragment, { children: [
    n > 0 && /* @__PURE__ */ o("span", { className: "mx-2 select-none", "aria-hidden": !0, children: "·" }),
    /* @__PURE__ */ o("a", { href: r.href, className: "hover:text-foreground hover:underline transition-colors", children: r.label })
  ] }, r.href)) });
}
function Tr({ onCheckout: e, className: t }) {
  const r = se((l) => l.items), n = se((l) => l.subtotal), a = se((l) => l.itemCount), i = se((l) => l.clearCart);
  return r.length === 0 ? /* @__PURE__ */ u("div", { className: U("flex flex-col items-center justify-center gap-6 py-24", t), children: [
    /* @__PURE__ */ o("div", { className: "flex h-24 w-24 items-center justify-center rounded-full bg-muted", children: /* @__PURE__ */ o(Xe, { className: "h-10 w-10 text-muted-foreground" }) }),
    /* @__PURE__ */ u("div", { className: "text-center", children: [
      /* @__PURE__ */ o("h2", { className: "text-xl font-semibold", children: "Your cart is empty" }),
      /* @__PURE__ */ o("p", { className: "mt-1 text-sm text-muted-foreground", children: "Add some products to get started." })
    ] })
  ] }) : /* @__PURE__ */ u("div", { className: U("mx-auto max-w-3xl space-y-6 px-4 py-8", t), children: [
    /* @__PURE__ */ u(de, { children: [
      /* @__PURE__ */ u(me, { className: "flex-row items-center justify-between space-y-0", children: [
        /* @__PURE__ */ u(he, { className: "flex items-center gap-2 text-xl", children: [
          /* @__PURE__ */ o(Xe, { className: "h-5 w-5" }),
          "Cart",
          /* @__PURE__ */ u("span", { className: "text-sm font-normal text-muted-foreground", children: [
            "(",
            a,
            " ",
            a === 1 ? "item" : "items",
            ")"
          ] })
        ] }),
        /* @__PURE__ */ u(re, { variant: "ghost", size: "sm", className: "text-destructive", onClick: i, children: [
          /* @__PURE__ */ o(St, { className: "mr-1 h-4 w-4" }),
          "Clear"
        ] })
      ] }),
      /* @__PURE__ */ o(fe, { className: "space-y-3", children: r.map((l) => /* @__PURE__ */ o(xr, { item: l }, l.id)) }),
      /* @__PURE__ */ o(ye, {}),
      /* @__PURE__ */ u(Pt, { className: "flex-col items-stretch gap-4 pt-6", children: [
        /* @__PURE__ */ u("div", { className: "flex items-center justify-between text-lg font-semibold", children: [
          /* @__PURE__ */ o("span", { children: "Subtotal" }),
          /* @__PURE__ */ u("span", { className: "tabular-nums", children: [
            "$",
            n.toFixed(2)
          ] })
        ] }),
        /* @__PURE__ */ o("p", { className: "text-xs text-muted-foreground", children: "Shipping and taxes calculated at checkout." }),
        /* @__PURE__ */ o(re, { size: "lg", className: "w-full", onClick: e, children: "Proceed to Checkout" })
      ] })
    ] }),
    /* @__PURE__ */ o(kt, { className: "pt-2" })
  ] });
}
function kr({ tax: e, shipping: t, className: r }) {
  const n = se((s) => s.items), a = se((s) => s.subtotal), i = e ?? 0, l = t ?? 0, c = a + i + l;
  return /* @__PURE__ */ u(de, { className: U("", r), children: [
    /* @__PURE__ */ o(me, { children: /* @__PURE__ */ o(he, { className: "text-lg", children: "Order Summary" }) }),
    /* @__PURE__ */ u(fe, { className: "space-y-4", children: [
      /* @__PURE__ */ o("ul", { className: "space-y-2 text-sm", children: n.map((s) => /* @__PURE__ */ u("li", { className: "flex justify-between gap-2", children: [
        /* @__PURE__ */ u("div", { className: "flex flex-col min-w-0", children: [
          /* @__PURE__ */ u("span", { className: "truncate text-muted-foreground", children: [
            s.title,
            " × ",
            s.quantity
          ] }),
          s.vendorSlug && /* @__PURE__ */ u("a", { href: `/user/${s.vendorSlug}`, className: "text-xs text-primary hover:underline", children: [
            "via ",
            s.vendorSlug
          ] })
        ] }),
        /* @__PURE__ */ u("span", { className: "shrink-0 tabular-nums", children: [
          "$",
          (s.price * s.quantity).toFixed(2)
        ] })
      ] }, s.id)) }),
      /* @__PURE__ */ o(ye, {}),
      /* @__PURE__ */ u("div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ o("span", { className: "text-muted-foreground", children: "Subtotal" }),
        /* @__PURE__ */ u("span", { className: "tabular-nums", children: [
          "$",
          a.toFixed(2)
        ] })
      ] }),
      /* @__PURE__ */ u("div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ o("span", { className: "text-muted-foreground", children: "Tax" }),
        /* @__PURE__ */ o("span", { className: "tabular-nums", children: e !== void 0 ? `$${i.toFixed(2)}` : "Calculated at next step" })
      ] }),
      /* @__PURE__ */ u("div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ o("span", { className: "text-muted-foreground", children: "Shipping" }),
        /* @__PURE__ */ o("span", { className: "tabular-nums", children: t !== void 0 ? l === 0 ? "Free" : `$${l.toFixed(2)}` : "TBD" })
      ] }),
      /* @__PURE__ */ o(ye, {}),
      /* @__PURE__ */ u("div", { className: "flex justify-between text-base font-semibold", children: [
        /* @__PURE__ */ o("span", { children: "Total" }),
        /* @__PURE__ */ u("span", { className: "tabular-nums", children: [
          "$",
          c.toFixed(2)
        ] })
      ] })
    ] })
  ] });
}
const pe = L.forwardRef(
  ({ className: e, type: t, ...r }, n) => /* @__PURE__ */ o(
    "input",
    {
      type: t,
      className: U(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        e
      ),
      ref: n,
      ...r
    }
  )
);
pe.displayName = "Input";
var Rr = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], Or = Rr.reduce((e, t) => {
  const r = /* @__PURE__ */ Ve(`Primitive.${t}`), n = L.forwardRef((a, i) => {
    const { asChild: l, ...c } = a, s = l ? r : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ o(s, { ...c, ref: i });
  });
  return n.displayName = `Primitive.${t}`, { ...e, [t]: n };
}, {}), Ir = "Label", Rt = L.forwardRef((e, t) => /* @__PURE__ */ o(
  Or.label,
  {
    ...e,
    ref: t,
    onMouseDown: (r) => {
      var a;
      r.target.closest("button, input, select, textarea") || ((a = e.onMouseDown) == null || a.call(e, r), !r.defaultPrevented && r.detail > 1 && r.preventDefault());
    }
  }
));
Rt.displayName = Ir;
var Ot = Rt;
const jr = Be(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
), le = L.forwardRef(({ className: e, ...t }, r) => /* @__PURE__ */ o(Ot, { ref: r, className: U(jr(), e), ...t }));
le.displayName = Ot.displayName;
function $r(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var We = { exports: {} }, Ce = { exports: {} }, $ = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var at;
function Ar() {
  if (at) return $;
  at = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, i = e ? Symbol.for("react.profiler") : 60114, l = e ? Symbol.for("react.provider") : 60109, c = e ? Symbol.for("react.context") : 60110, s = e ? Symbol.for("react.async_mode") : 60111, m = e ? Symbol.for("react.concurrent_mode") : 60111, h = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, j = e ? Symbol.for("react.lazy") : 60116, N = e ? Symbol.for("react.block") : 60121, I = e ? Symbol.for("react.fundamental") : 60117, S = e ? Symbol.for("react.responder") : 60118, ne = e ? Symbol.for("react.scope") : 60119;
  function k(p) {
    if (typeof p == "object" && p !== null) {
      var Z = p.$$typeof;
      switch (Z) {
        case t:
          switch (p = p.type, p) {
            case s:
            case m:
            case n:
            case i:
            case a:
            case f:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case c:
                case h:
                case j:
                case w:
                case l:
                  return p;
                default:
                  return Z;
              }
          }
        case r:
          return Z;
      }
    }
  }
  function W(p) {
    return k(p) === m;
  }
  return $.AsyncMode = s, $.ConcurrentMode = m, $.ContextConsumer = c, $.ContextProvider = l, $.Element = t, $.ForwardRef = h, $.Fragment = n, $.Lazy = j, $.Memo = w, $.Portal = r, $.Profiler = i, $.StrictMode = a, $.Suspense = f, $.isAsyncMode = function(p) {
    return W(p) || k(p) === s;
  }, $.isConcurrentMode = W, $.isContextConsumer = function(p) {
    return k(p) === c;
  }, $.isContextProvider = function(p) {
    return k(p) === l;
  }, $.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, $.isForwardRef = function(p) {
    return k(p) === h;
  }, $.isFragment = function(p) {
    return k(p) === n;
  }, $.isLazy = function(p) {
    return k(p) === j;
  }, $.isMemo = function(p) {
    return k(p) === w;
  }, $.isPortal = function(p) {
    return k(p) === r;
  }, $.isProfiler = function(p) {
    return k(p) === i;
  }, $.isStrictMode = function(p) {
    return k(p) === a;
  }, $.isSuspense = function(p) {
    return k(p) === f;
  }, $.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === n || p === m || p === i || p === a || p === f || p === g || typeof p == "object" && p !== null && (p.$$typeof === j || p.$$typeof === w || p.$$typeof === l || p.$$typeof === c || p.$$typeof === h || p.$$typeof === I || p.$$typeof === S || p.$$typeof === ne || p.$$typeof === N);
  }, $.typeOf = k, $;
}
var A = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ot;
function Mr() {
  return ot || (ot = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, i = e ? Symbol.for("react.profiler") : 60114, l = e ? Symbol.for("react.provider") : 60109, c = e ? Symbol.for("react.context") : 60110, s = e ? Symbol.for("react.async_mode") : 60111, m = e ? Symbol.for("react.concurrent_mode") : 60111, h = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, j = e ? Symbol.for("react.lazy") : 60116, N = e ? Symbol.for("react.block") : 60121, I = e ? Symbol.for("react.fundamental") : 60117, S = e ? Symbol.for("react.responder") : 60118, ne = e ? Symbol.for("react.scope") : 60119;
    function k(y) {
      return typeof y == "string" || typeof y == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      y === n || y === m || y === i || y === a || y === f || y === g || typeof y == "object" && y !== null && (y.$$typeof === j || y.$$typeof === w || y.$$typeof === l || y.$$typeof === c || y.$$typeof === h || y.$$typeof === I || y.$$typeof === S || y.$$typeof === ne || y.$$typeof === N);
    }
    function W(y) {
      if (typeof y == "object" && y !== null) {
        var ie = y.$$typeof;
        switch (ie) {
          case t:
            var Se = y.type;
            switch (Se) {
              case s:
              case m:
              case n:
              case i:
              case a:
              case f:
                return Se;
              default:
                var Ge = Se && Se.$$typeof;
                switch (Ge) {
                  case c:
                  case h:
                  case j:
                  case w:
                  case l:
                    return Ge;
                  default:
                    return ie;
                }
            }
          case r:
            return ie;
        }
      }
    }
    var p = s, Z = m, ce = c, Q = l, q = t, b = h, z = n, Y = j, ee = w, V = r, J = i, te = a, oe = f, H = !1;
    function ge(y) {
      return H || (H = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(y) || W(y) === s;
    }
    function d(y) {
      return W(y) === m;
    }
    function v(y) {
      return W(y) === c;
    }
    function E(y) {
      return W(y) === l;
    }
    function P(y) {
      return typeof y == "object" && y !== null && y.$$typeof === t;
    }
    function x(y) {
      return W(y) === h;
    }
    function T(y) {
      return W(y) === n;
    }
    function C(y) {
      return W(y) === j;
    }
    function _(y) {
      return W(y) === w;
    }
    function R(y) {
      return W(y) === r;
    }
    function M(y) {
      return W(y) === i;
    }
    function O(y) {
      return W(y) === a;
    }
    function G(y) {
      return W(y) === f;
    }
    A.AsyncMode = p, A.ConcurrentMode = Z, A.ContextConsumer = ce, A.ContextProvider = Q, A.Element = q, A.ForwardRef = b, A.Fragment = z, A.Lazy = Y, A.Memo = ee, A.Portal = V, A.Profiler = J, A.StrictMode = te, A.Suspense = oe, A.isAsyncMode = ge, A.isConcurrentMode = d, A.isContextConsumer = v, A.isContextProvider = E, A.isElement = P, A.isForwardRef = x, A.isFragment = T, A.isLazy = C, A.isMemo = _, A.isPortal = R, A.isProfiler = M, A.isStrictMode = O, A.isSuspense = G, A.isValidElementType = k, A.typeOf = W;
  }()), A;
}
var it;
function It() {
  return it || (it = 1, process.env.NODE_ENV === "production" ? Ce.exports = Ar() : Ce.exports = Mr()), Ce.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Ie, st;
function Lr() {
  if (st) return Ie;
  st = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(i) {
    if (i == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(i);
  }
  function a() {
    try {
      if (!Object.assign)
        return !1;
      var i = new String("abc");
      if (i[5] = "de", Object.getOwnPropertyNames(i)[0] === "5")
        return !1;
      for (var l = {}, c = 0; c < 10; c++)
        l["_" + String.fromCharCode(c)] = c;
      var s = Object.getOwnPropertyNames(l).map(function(h) {
        return l[h];
      });
      if (s.join("") !== "0123456789")
        return !1;
      var m = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(h) {
        m[h] = h;
      }), Object.keys(Object.assign({}, m)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Ie = a() ? Object.assign : function(i, l) {
    for (var c, s = n(i), m, h = 1; h < arguments.length; h++) {
      c = Object(arguments[h]);
      for (var f in c)
        t.call(c, f) && (s[f] = c[f]);
      if (e) {
        m = e(c);
        for (var g = 0; g < m.length; g++)
          r.call(c, m[g]) && (s[m[g]] = c[m[g]]);
      }
    }
    return s;
  }, Ie;
}
var je, ct;
function Je() {
  if (ct) return je;
  ct = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return je = e, je;
}
var $e, lt;
function jt() {
  return lt || (lt = 1, $e = Function.call.bind(Object.prototype.hasOwnProperty)), $e;
}
var Ae, ut;
function Dr() {
  if (ut) return Ae;
  ut = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = Je(), r = {}, n = jt();
    e = function(i) {
      var l = "Warning: " + i;
      typeof console < "u" && console.error(l);
      try {
        throw new Error(l);
      } catch {
      }
    };
  }
  function a(i, l, c, s, m) {
    if (process.env.NODE_ENV !== "production") {
      for (var h in i)
        if (n(i, h)) {
          var f;
          try {
            if (typeof i[h] != "function") {
              var g = Error(
                (s || "React class") + ": " + c + " type `" + h + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof i[h] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw g.name = "Invariant Violation", g;
            }
            f = i[h](l, h, s, c, null, t);
          } catch (j) {
            f = j;
          }
          if (f && !(f instanceof Error) && e(
            (s || "React class") + ": type specification of " + c + " `" + h + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in r)) {
            r[f.message] = !0;
            var w = m ? m() : "";
            e(
              "Failed " + c + " type: " + f.message + (w ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Ae = a, Ae;
}
var Me, dt;
function Fr() {
  if (dt) return Me;
  dt = 1;
  var e = It(), t = Lr(), r = Je(), n = jt(), a = Dr(), i = function() {
  };
  process.env.NODE_ENV !== "production" && (i = function(c) {
    var s = "Warning: " + c;
    typeof console < "u" && console.error(s);
    try {
      throw new Error(s);
    } catch {
    }
  });
  function l() {
    return null;
  }
  return Me = function(c, s) {
    var m = typeof Symbol == "function" && Symbol.iterator, h = "@@iterator";
    function f(d) {
      var v = d && (m && d[m] || d[h]);
      if (typeof v == "function")
        return v;
    }
    var g = "<<anonymous>>", w = {
      array: S("array"),
      bigint: S("bigint"),
      bool: S("boolean"),
      func: S("function"),
      number: S("number"),
      object: S("object"),
      string: S("string"),
      symbol: S("symbol"),
      any: ne(),
      arrayOf: k,
      element: W(),
      elementType: p(),
      instanceOf: Z,
      node: b(),
      objectOf: Q,
      oneOf: ce,
      oneOfType: q,
      shape: Y,
      exact: ee
    };
    function j(d, v) {
      return d === v ? d !== 0 || 1 / d === 1 / v : d !== d && v !== v;
    }
    function N(d, v) {
      this.message = d, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    N.prototype = Error.prototype;
    function I(d) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, E = 0;
      function P(T, C, _, R, M, O, G) {
        if (R = R || g, O = O || _, G !== r) {
          if (s) {
            var y = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw y.name = "Invariant Violation", y;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ie = R + ":" + _;
            !v[ie] && // Avoid spamming the console because they are often not actionable except for lib authors
            E < 3 && (i(
              "You are manually calling a React.PropTypes validation function for the `" + O + "` prop on `" + R + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[ie] = !0, E++);
          }
        }
        return C[_] == null ? T ? C[_] === null ? new N("The " + M + " `" + O + "` is marked as required " + ("in `" + R + "`, but its value is `null`.")) : new N("The " + M + " `" + O + "` is marked as required in " + ("`" + R + "`, but its value is `undefined`.")) : null : d(C, _, R, M, O);
      }
      var x = P.bind(null, !1);
      return x.isRequired = P.bind(null, !0), x;
    }
    function S(d) {
      function v(E, P, x, T, C, _) {
        var R = E[P], M = te(R);
        if (M !== d) {
          var O = oe(R);
          return new N(
            "Invalid " + T + " `" + C + "` of type " + ("`" + O + "` supplied to `" + x + "`, expected ") + ("`" + d + "`."),
            { expectedType: d }
          );
        }
        return null;
      }
      return I(v);
    }
    function ne() {
      return I(l);
    }
    function k(d) {
      function v(E, P, x, T, C) {
        if (typeof d != "function")
          return new N("Property `" + C + "` of component `" + x + "` has invalid PropType notation inside arrayOf.");
        var _ = E[P];
        if (!Array.isArray(_)) {
          var R = te(_);
          return new N("Invalid " + T + " `" + C + "` of type " + ("`" + R + "` supplied to `" + x + "`, expected an array."));
        }
        for (var M = 0; M < _.length; M++) {
          var O = d(_, M, x, T, C + "[" + M + "]", r);
          if (O instanceof Error)
            return O;
        }
        return null;
      }
      return I(v);
    }
    function W() {
      function d(v, E, P, x, T) {
        var C = v[E];
        if (!c(C)) {
          var _ = te(C);
          return new N("Invalid " + x + " `" + T + "` of type " + ("`" + _ + "` supplied to `" + P + "`, expected a single ReactElement."));
        }
        return null;
      }
      return I(d);
    }
    function p() {
      function d(v, E, P, x, T) {
        var C = v[E];
        if (!e.isValidElementType(C)) {
          var _ = te(C);
          return new N("Invalid " + x + " `" + T + "` of type " + ("`" + _ + "` supplied to `" + P + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return I(d);
    }
    function Z(d) {
      function v(E, P, x, T, C) {
        if (!(E[P] instanceof d)) {
          var _ = d.name || g, R = ge(E[P]);
          return new N("Invalid " + T + " `" + C + "` of type " + ("`" + R + "` supplied to `" + x + "`, expected ") + ("instance of `" + _ + "`."));
        }
        return null;
      }
      return I(v);
    }
    function ce(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? i(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : i("Invalid argument supplied to oneOf, expected an array.")), l;
      function v(E, P, x, T, C) {
        for (var _ = E[P], R = 0; R < d.length; R++)
          if (j(_, d[R]))
            return null;
        var M = JSON.stringify(d, function(G, y) {
          var ie = oe(y);
          return ie === "symbol" ? String(y) : y;
        });
        return new N("Invalid " + T + " `" + C + "` of value `" + String(_) + "` " + ("supplied to `" + x + "`, expected one of " + M + "."));
      }
      return I(v);
    }
    function Q(d) {
      function v(E, P, x, T, C) {
        if (typeof d != "function")
          return new N("Property `" + C + "` of component `" + x + "` has invalid PropType notation inside objectOf.");
        var _ = E[P], R = te(_);
        if (R !== "object")
          return new N("Invalid " + T + " `" + C + "` of type " + ("`" + R + "` supplied to `" + x + "`, expected an object."));
        for (var M in _)
          if (n(_, M)) {
            var O = d(_, M, x, T, C + "." + M, r);
            if (O instanceof Error)
              return O;
          }
        return null;
      }
      return I(v);
    }
    function q(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && i("Invalid argument supplied to oneOfType, expected an instance of array."), l;
      for (var v = 0; v < d.length; v++) {
        var E = d[v];
        if (typeof E != "function")
          return i(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + H(E) + " at index " + v + "."
          ), l;
      }
      function P(x, T, C, _, R) {
        for (var M = [], O = 0; O < d.length; O++) {
          var G = d[O], y = G(x, T, C, _, R, r);
          if (y == null)
            return null;
          y.data && n(y.data, "expectedType") && M.push(y.data.expectedType);
        }
        var ie = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new N("Invalid " + _ + " `" + R + "` supplied to " + ("`" + C + "`" + ie + "."));
      }
      return I(P);
    }
    function b() {
      function d(v, E, P, x, T) {
        return V(v[E]) ? null : new N("Invalid " + x + " `" + T + "` supplied to " + ("`" + P + "`, expected a ReactNode."));
      }
      return I(d);
    }
    function z(d, v, E, P, x) {
      return new N(
        (d || "React class") + ": " + v + " type `" + E + "." + P + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + x + "`."
      );
    }
    function Y(d) {
      function v(E, P, x, T, C) {
        var _ = E[P], R = te(_);
        if (R !== "object")
          return new N("Invalid " + T + " `" + C + "` of type `" + R + "` " + ("supplied to `" + x + "`, expected `object`."));
        for (var M in d) {
          var O = d[M];
          if (typeof O != "function")
            return z(x, T, C, M, oe(O));
          var G = O(_, M, x, T, C + "." + M, r);
          if (G)
            return G;
        }
        return null;
      }
      return I(v);
    }
    function ee(d) {
      function v(E, P, x, T, C) {
        var _ = E[P], R = te(_);
        if (R !== "object")
          return new N("Invalid " + T + " `" + C + "` of type `" + R + "` " + ("supplied to `" + x + "`, expected `object`."));
        var M = t({}, E[P], d);
        for (var O in M) {
          var G = d[O];
          if (n(d, O) && typeof G != "function")
            return z(x, T, C, O, oe(G));
          if (!G)
            return new N(
              "Invalid " + T + " `" + C + "` key `" + O + "` supplied to `" + x + "`.\nBad object: " + JSON.stringify(E[P], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(d), null, "  ")
            );
          var y = G(_, O, x, T, C + "." + O, r);
          if (y)
            return y;
        }
        return null;
      }
      return I(v);
    }
    function V(d) {
      switch (typeof d) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !d;
        case "object":
          if (Array.isArray(d))
            return d.every(V);
          if (d === null || c(d))
            return !0;
          var v = f(d);
          if (v) {
            var E = v.call(d), P;
            if (v !== d.entries) {
              for (; !(P = E.next()).done; )
                if (!V(P.value))
                  return !1;
            } else
              for (; !(P = E.next()).done; ) {
                var x = P.value;
                if (x && !V(x[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function J(d, v) {
      return d === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function te(d) {
      var v = typeof d;
      return Array.isArray(d) ? "array" : d instanceof RegExp ? "object" : J(v, d) ? "symbol" : v;
    }
    function oe(d) {
      if (typeof d > "u" || d === null)
        return "" + d;
      var v = te(d);
      if (v === "object") {
        if (d instanceof Date)
          return "date";
        if (d instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function H(d) {
      var v = oe(d);
      switch (v) {
        case "array":
        case "object":
          return "an " + v;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + v;
        default:
          return v;
      }
    }
    function ge(d) {
      return !d.constructor || !d.constructor.name ? g : d.constructor.name;
    }
    return w.checkPropTypes = a, w.resetWarningCache = a.resetWarningCache, w.PropTypes = w, w;
  }, Me;
}
var Le, ft;
function qr() {
  if (ft) return Le;
  ft = 1;
  var e = Je();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, Le = function() {
    function n(l, c, s, m, h, f) {
      if (f !== e) {
        var g = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw g.name = "Invariant Violation", g;
      }
    }
    n.isRequired = n;
    function a() {
      return n;
    }
    var i = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: a,
      element: n,
      elementType: n,
      instanceOf: a,
      node: n,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return i.PropTypes = i, i;
  }, Le;
}
if (process.env.NODE_ENV !== "production") {
  var Wr = It(), Ur = !0;
  We.exports = Fr()(Wr.isElement, Ur);
} else
  We.exports = qr()();
var zr = We.exports;
const D = /* @__PURE__ */ $r(zr);
function pt(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function mt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? pt(Object(r), !0).forEach(function(n) {
      $t(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : pt(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Te(e) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? Te = function(t) {
    return typeof t;
  } : Te = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Te(e);
}
function $t(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function Yr(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), a, i;
  for (i = 0; i < n.length; i++)
    a = n[i], !(t.indexOf(a) >= 0) && (r[a] = e[a]);
  return r;
}
function Hr(e, t) {
  if (e == null) return {};
  var r = Yr(e, t), n, a;
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (a = 0; a < i.length; a++)
      n = i[a], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function At(e, t) {
  return Vr(e) || Br(e, t) || Jr(e, t) || Gr();
}
function Vr(e) {
  if (Array.isArray(e)) return e;
}
function Br(e, t) {
  var r = e && (typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"]);
  if (r != null) {
    var n = [], a = !0, i = !1, l, c;
    try {
      for (r = r.call(e); !(a = (l = r.next()).done) && (n.push(l.value), !(t && n.length === t)); a = !0)
        ;
    } catch (s) {
      i = !0, c = s;
    } finally {
      try {
        !a && r.return != null && r.return();
      } finally {
        if (i) throw c;
      }
    }
    return n;
  }
}
function Jr(e, t) {
  if (e) {
    if (typeof e == "string") return ht(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return ht(e, t);
  }
}
function ht(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function Gr() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
var B = function(t, r, n) {
  var a = !!n, i = F.useRef(n);
  F.useEffect(function() {
    i.current = n;
  }, [n]), F.useEffect(function() {
    if (!a || !t)
      return function() {
      };
    var l = function() {
      i.current && i.current.apply(i, arguments);
    };
    return t.on(r, l), function() {
      t.off(r, l);
    };
  }, [a, r, t, i]);
}, Ue = function(t) {
  var r = F.useRef(t);
  return F.useEffect(function() {
    r.current = t;
  }, [t]), r.current;
}, ve = function(t) {
  return t !== null && Te(t) === "object";
}, Xr = function(t) {
  return ve(t) && typeof t.then == "function";
}, Kr = function(t) {
  return ve(t) && typeof t.elements == "function" && typeof t.createToken == "function" && typeof t.createPaymentMethod == "function" && typeof t.confirmCardPayment == "function";
}, yt = "[object Object]", Qr = function e(t, r) {
  if (!ve(t) || !ve(r))
    return t === r;
  var n = Array.isArray(t), a = Array.isArray(r);
  if (n !== a) return !1;
  var i = Object.prototype.toString.call(t) === yt, l = Object.prototype.toString.call(r) === yt;
  if (i !== l) return !1;
  if (!i && !n) return t === r;
  var c = Object.keys(t), s = Object.keys(r);
  if (c.length !== s.length) return !1;
  for (var m = {}, h = 0; h < c.length; h += 1)
    m[c[h]] = !0;
  for (var f = 0; f < s.length; f += 1)
    m[s[f]] = !0;
  var g = Object.keys(m);
  if (g.length !== c.length)
    return !1;
  var w = t, j = r, N = function(S) {
    return e(w[S], j[S]);
  };
  return g.every(N);
}, Mt = function(t, r, n) {
  return ve(t) ? Object.keys(t).reduce(function(a, i) {
    var l = !ve(r) || !Qr(t[i], r[i]);
    return n.includes(i) ? (l && console.warn("Unsupported prop change: options.".concat(i, " is not a mutable property.")), a) : l ? mt(mt({}, a || {}), {}, $t({}, i, t[i])) : a;
  }, null) : null;
}, Lt = "Invalid prop `stripe` supplied to `Elements`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`. See https://stripe.com/docs/stripe-js/react#elements-props-stripe for details.", vt = function(t) {
  var r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : Lt;
  if (t === null || Kr(t))
    return t;
  throw new Error(r);
}, Zr = function(t) {
  var r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : Lt;
  if (Xr(t))
    return {
      tag: "async",
      stripePromise: Promise.resolve(t).then(function(a) {
        return vt(a, r);
      })
    };
  var n = vt(t, r);
  return n === null ? {
    tag: "empty"
  } : {
    tag: "sync",
    stripe: n
  };
}, en = function(t) {
  !t || !t._registerWrapper || !t.registerAppInfo || (t._registerWrapper({
    name: "react-stripe-js",
    version: "5.6.0"
  }), t.registerAppInfo({
    name: "react-stripe-js",
    version: "5.6.0",
    url: "https://stripe.com/docs/stripe-js/react"
  }));
}, Oe = /* @__PURE__ */ F.createContext(null);
Oe.displayName = "ElementsContext";
var Dt = function(t, r) {
  if (!t)
    throw new Error("Could not find Elements context; You need to wrap the part of your app that ".concat(r, " in an <Elements> provider."));
  return t;
}, Ft = function(t) {
  var r = t.stripe, n = t.options, a = t.children, i = F.useMemo(function() {
    return Zr(r);
  }, [r]), l = F.useState(function() {
    return {
      stripe: i.tag === "sync" ? i.stripe : null,
      elements: i.tag === "sync" ? i.stripe.elements(n) : null
    };
  }), c = At(l, 2), s = c[0], m = c[1];
  F.useEffect(function() {
    var g = !0, w = function(N) {
      m(function(I) {
        return I.stripe ? I : {
          stripe: N,
          elements: N.elements(n)
        };
      });
    };
    return i.tag === "async" && !s.stripe ? i.stripePromise.then(function(j) {
      j && g && w(j);
    }) : i.tag === "sync" && !s.stripe && w(i.stripe), function() {
      g = !1;
    };
  }, [i, s, n]);
  var h = Ue(r);
  F.useEffect(function() {
    h !== null && h !== r && console.warn("Unsupported prop change on Elements: You cannot change the `stripe` prop after setting it.");
  }, [h, r]);
  var f = Ue(n);
  return F.useEffect(function() {
    if (s.elements) {
      var g = Mt(n, f, ["clientSecret", "fonts"]);
      g && s.elements.update(g);
    }
  }, [n, f, s.elements]), F.useEffect(function() {
    en(s.stripe);
  }, [s.stripe]), /* @__PURE__ */ F.createElement(Oe.Provider, {
    value: s
  }, a);
};
Ft.propTypes = {
  stripe: D.any,
  options: D.object
};
var tn = function(t) {
  var r = F.useContext(Oe);
  return Dt(r, t);
}, rn = function() {
  var t = tn("calls useElements()"), r = t.elements;
  return r;
};
D.func.isRequired;
var qt = /* @__PURE__ */ F.createContext(null);
qt.displayName = "CheckoutContext";
D.any, D.shape({
  clientSecret: D.oneOfType([D.string, D.instanceOf(Promise)]).isRequired,
  elementsOptions: D.object
}).isRequired;
var ze = function(t) {
  var r = F.useContext(qt), n = F.useContext(Oe);
  if (r) {
    if (n)
      throw new Error("You cannot wrap the part of your app that ".concat(t, " in both <CheckoutProvider> and <Elements> providers."));
    return r;
  } else
    return Dt(n, t);
}, nn = ["mode"], an = function(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}, X = function(t, r) {
  var n = "".concat(an(t), "Element"), a = function(s) {
    var m = s.id, h = s.className, f = s.options, g = f === void 0 ? {} : f, w = s.onBlur, j = s.onFocus, N = s.onReady, I = s.onChange, S = s.onEscape, ne = s.onClick, k = s.onLoadError, W = s.onLoaderStart, p = s.onNetworksChange, Z = s.onConfirm, ce = s.onCancel, Q = s.onShippingAddressChange, q = s.onShippingRateChange, b = s.onSavedPaymentMethodRemove, z = s.onSavedPaymentMethodUpdate, Y = ze("mounts <".concat(n, ">")), ee = "elements" in Y ? Y.elements : null, V = "checkoutState" in Y ? Y.checkoutState : null, J = (V == null ? void 0 : V.type) === "success" || (V == null ? void 0 : V.type) === "loading" ? V.sdk : null, te = F.useState(null), oe = At(te, 2), H = oe[0], ge = oe[1], d = F.useRef(null), v = F.useRef(null);
    B(H, "blur", w), B(H, "focus", j), B(H, "escape", S), B(H, "click", ne), B(H, "loaderror", k), B(H, "loaderstart", W), B(H, "networkschange", p), B(H, "confirm", Z), B(H, "cancel", ce), B(H, "shippingaddresschange", Q), B(H, "shippingratechange", q), B(H, "savedpaymentmethodremove", b), B(H, "savedpaymentmethodupdate", z), B(H, "change", I);
    var E;
    N && (t === "expressCheckout" ? E = N : E = function() {
      N(H);
    }), B(H, "ready", E), F.useLayoutEffect(function() {
      if (d.current === null && v.current !== null && (ee || J)) {
        var x = null;
        if (J)
          switch (t) {
            case "paymentForm":
              x = J.createPaymentFormElement(g);
              break;
            case "payment":
              x = J.createPaymentElement(g);
              break;
            case "address":
              if ("mode" in g) {
                var T = g.mode, C = Hr(g, nn);
                if (T === "shipping")
                  x = J.createShippingAddressElement(C);
                else if (T === "billing")
                  x = J.createBillingAddressElement(C);
                else
                  throw new Error("Invalid options.mode. mode must be 'billing' or 'shipping'.");
              } else
                throw new Error("You must supply options.mode. mode must be 'billing' or 'shipping'.");
              break;
            case "expressCheckout":
              x = J.createExpressCheckoutElement(g);
              break;
            case "currencySelector":
              x = J.createCurrencySelectorElement();
              break;
            case "taxId":
              x = J.createTaxIdElement(g);
              break;
            default:
              throw new Error("Invalid Element type ".concat(n, ". You must use either the <PaymentElement />, <AddressElement options={{mode: 'shipping'}} />, <AddressElement options={{mode: 'billing'}} />, or <ExpressCheckoutElement />."));
          }
        else ee && (x = ee.create(t, g));
        d.current = x, ge(x), x && x.mount(v.current);
      }
    }, [ee, J, g]);
    var P = Ue(g);
    return F.useEffect(function() {
      if (d.current) {
        var x = Mt(g, P, ["paymentRequest"]);
        x && "update" in d.current && d.current.update(x);
      }
    }, [g, P]), F.useLayoutEffect(function() {
      return function() {
        if (d.current && typeof d.current.destroy == "function")
          try {
            d.current.destroy(), d.current = null;
          } catch {
          }
      };
    }, []), /* @__PURE__ */ F.createElement("div", {
      id: m,
      className: h,
      ref: v
    });
  }, i = function(s) {
    ze("mounts <".concat(n, ">"));
    var m = s.id, h = s.className;
    return /* @__PURE__ */ F.createElement("div", {
      id: m,
      className: h
    });
  }, l = r ? i : a;
  return l.propTypes = {
    id: D.string,
    className: D.string,
    onChange: D.func,
    onBlur: D.func,
    onFocus: D.func,
    onReady: D.func,
    onEscape: D.func,
    onClick: D.func,
    onLoadError: D.func,
    onLoaderStart: D.func,
    onNetworksChange: D.func,
    onConfirm: D.func,
    onCancel: D.func,
    onShippingAddressChange: D.func,
    onShippingRateChange: D.func,
    onSavedPaymentMethodRemove: D.func,
    onSavedPaymentMethodUpdate: D.func,
    options: D.object
  }, l.displayName = n, l.__elementType = t, l;
}, K = typeof window > "u", on = /* @__PURE__ */ F.createContext(null);
on.displayName = "EmbeddedCheckoutProviderContext";
var sn = function() {
  var t = ze("calls useStripe()"), r = t.stripe;
  return r;
};
X("auBankAccount", K);
X("card", K);
X("cardNumber", K);
X("cardExpiry", K);
X("cardCvc", K);
X("iban", K);
var cn = X("payment", K);
X("expressCheckout", K);
X("paymentRequestButton", K);
var ln = X("linkAuthentication", K);
X("address", K);
X("shippingAddress", K);
X("paymentMethodMessaging", K);
X("taxId", K);
function un({
  onPaymentSuccess: e,
  returnUrl: t,
  defaultEmail: r,
  defaultName: n
}) {
  const a = sn(), i = rn(), [l, c] = ae(null), [s, m] = ae(!1);
  return /* @__PURE__ */ u("div", { className: "space-y-4", children: [
    /* @__PURE__ */ o(
      ln,
      {
        id: "link-authentication-element",
        options: r ? { defaultValues: { email: r } } : void 0
      }
    ),
    /* @__PURE__ */ o(
      cn,
      {
        id: "payment-element",
        options: {
          layout: "accordion",
          defaultValues: {
            billingDetails: {
              name: n ?? ""
            }
          },
          business: { name: "PolyMech" }
        }
      }
    ),
    /* @__PURE__ */ o(
      re,
      {
        type: "button",
        onClick: async () => {
          if (!a || !i) return;
          m(!0), c(null);
          const { error: f, paymentIntent: g } = await a.confirmPayment({
            elements: i,
            confirmParams: {
              return_url: t ?? `${window.location.origin}/completion`
            },
            redirect: "if_required"
          });
          f ? f.type === "card_error" || f.type === "validation_error" ? c(f.message ?? "Payment failed.") : c("An unexpected error occurred.") : g && (e == null || e({
            id: g.id,
            status: g.status
          })), m(!1);
        },
        disabled: s || !a || !i,
        className: "w-full",
        size: "lg",
        children: s ? /* @__PURE__ */ u(Yt, { children: [
          /* @__PURE__ */ o(Bt, { className: "mr-2 h-4 w-4 animate-spin" }),
          "Processing…"
        ] }) : "Pay now"
      }
    ),
    l && /* @__PURE__ */ o("p", { className: "text-sm text-destructive text-center", children: l })
  ] });
}
function dn({
  onPlaceOrder: e,
  onSaveAddress: t,
  onBackToCart: r,
  initialShipping: n,
  savedAddresses: a,
  tax: i,
  shipping: l,
  stripePromise: c,
  stripeClientSecret: s,
  onStripePaymentSuccess: m,
  stripeReturnUrl: h,
  className: f
}) {
  const g = se((b) => b.itemCount), [w, j] = ae("shopify"), [N, I] = ae(!1), S = (a == null ? void 0 : a.find((b) => b.isDefault)) ?? (a == null ? void 0 : a[0]), ne = () => ({
    fullName: (S == null ? void 0 : S.fullName) ?? (n == null ? void 0 : n.fullName) ?? "",
    email: (S == null ? void 0 : S.email) ?? (n == null ? void 0 : n.email) ?? "",
    address: (S == null ? void 0 : S.address) ?? (n == null ? void 0 : n.address) ?? "",
    city: (S == null ? void 0 : S.city) ?? (n == null ? void 0 : n.city) ?? "",
    zip: (S == null ? void 0 : S.zip) ?? (n == null ? void 0 : n.zip) ?? "",
    country: (S == null ? void 0 : S.country) ?? (n == null ? void 0 : n.country) ?? ""
  }), [k, W] = ae(ne), [p, Z] = ae(
    (S == null ? void 0 : S.id) ?? "custom"
  ), ce = (b) => {
    if (Z(b), b === "custom") return;
    const z = a == null ? void 0 : a.find((Y) => Y.id === b);
    z && W({
      fullName: z.fullName,
      email: z.email,
      address: z.address,
      city: z.city,
      zip: z.zip,
      country: z.country
    });
  }, Q = (b, z) => W((Y) => ({ ...Y, [b]: z })), q = (b) => {
    b.preventDefault(), N && p === "custom" && t && t(k), e == null || e({ shipping: k, paymentMethod: w });
  };
  return g === 0 ? /* @__PURE__ */ u("div", { className: U("flex flex-col items-center justify-center gap-6 py-24", f), children: [
    /* @__PURE__ */ o(Jt, { className: "h-12 w-12 text-muted-foreground" }),
    /* @__PURE__ */ o("p", { className: "text-muted-foreground", children: "Your cart is empty — nothing to check out." }),
    r && /* @__PURE__ */ o(re, { variant: "outline", onClick: r, children: "Back to Cart" })
  ] }) : /* @__PURE__ */ o("div", { className: U("w-full mx-auto max-w-5xl px-4 py-8 overflow-x-hidden", f), children: /* @__PURE__ */ u(
    "form",
    {
      onSubmit: q,
      className: "grid gap-8 lg:grid-cols-[1fr_380px]",
      children: [
        /* @__PURE__ */ u("div", { className: "space-y-6 min-w-0", children: [
          /* @__PURE__ */ u(de, { children: [
            /* @__PURE__ */ o(me, { children: /* @__PURE__ */ o(he, { className: "text-lg", children: "Shipping Information" }) }),
            /* @__PURE__ */ u(fe, { className: "space-y-4", children: [
              a && a.length > 0 && /* @__PURE__ */ u("div", { className: "space-y-2", children: [
                /* @__PURE__ */ u(le, { className: "text-sm font-medium flex items-center gap-1.5", children: [
                  /* @__PURE__ */ o(Ke, { className: "h-4 w-4" }),
                  "Saved Addresses"
                ] }),
                /* @__PURE__ */ u("div", { className: "space-y-2", children: [
                  a.map((b) => /* @__PURE__ */ u(
                    "button",
                    {
                      type: "button",
                      onClick: () => ce(b.id),
                      className: U(
                        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors text-sm",
                        p === b.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent/5"
                      ),
                      children: [
                        /* @__PURE__ */ o(Ke, { className: "h-4 w-4 mt-0.5 shrink-0" }),
                        /* @__PURE__ */ u("div", { className: "min-w-0", children: [
                          /* @__PURE__ */ u("p", { className: "font-medium", children: [
                            b.label || b.fullName,
                            b.isDefault && /* @__PURE__ */ o("span", { className: "ml-2 text-xs text-muted-foreground", children: "(Default)" })
                          ] }),
                          /* @__PURE__ */ u("p", { className: "text-muted-foreground truncate", children: [
                            b.address,
                            ", ",
                            b.city,
                            ", ",
                            b.country
                          ] })
                        ] })
                      ]
                    },
                    b.id
                  )),
                  /* @__PURE__ */ u(
                    "button",
                    {
                      type: "button",
                      onClick: () => ce("custom"),
                      className: U(
                        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors text-sm",
                        p === "custom" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/5"
                      ),
                      children: [
                        /* @__PURE__ */ o("span", { className: "text-muted-foreground", children: "✏️" }),
                        /* @__PURE__ */ o("span", { className: "font-medium", children: "Enter a new address" })
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ u("div", { className: "grid gap-4 sm:grid-cols-2", children: [
                /* @__PURE__ */ u("div", { className: "sm:col-span-2 space-y-1.5", children: [
                  /* @__PURE__ */ o(le, { htmlFor: "ck-name", children: "Full Name" }),
                  /* @__PURE__ */ o(
                    pe,
                    {
                      id: "ck-name",
                      required: !0,
                      placeholder: "Jane Doe",
                      value: k.fullName,
                      onChange: (b) => Q("fullName", b.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ u("div", { className: "sm:col-span-2 space-y-1.5", children: [
                  /* @__PURE__ */ o(le, { htmlFor: "ck-email", children: "Email" }),
                  /* @__PURE__ */ o(
                    pe,
                    {
                      id: "ck-email",
                      type: "email",
                      required: !0,
                      placeholder: "jane@example.com",
                      value: k.email,
                      onChange: (b) => Q("email", b.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ u("div", { className: "sm:col-span-2 space-y-1.5", children: [
                  /* @__PURE__ */ o(le, { htmlFor: "ck-address", children: "Address" }),
                  /* @__PURE__ */ o(
                    pe,
                    {
                      id: "ck-address",
                      required: !0,
                      placeholder: "123 Main St",
                      value: k.address,
                      onChange: (b) => Q("address", b.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ u("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ o(le, { htmlFor: "ck-city", children: "City" }),
                  /* @__PURE__ */ o(
                    pe,
                    {
                      id: "ck-city",
                      required: !0,
                      placeholder: "New York",
                      value: k.city,
                      onChange: (b) => Q("city", b.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ u("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ o(le, { htmlFor: "ck-zip", children: "ZIP / Postal Code" }),
                  /* @__PURE__ */ o(
                    pe,
                    {
                      id: "ck-zip",
                      required: !0,
                      placeholder: "10001",
                      value: k.zip,
                      onChange: (b) => Q("zip", b.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ u("div", { className: "sm:col-span-2 space-y-1.5", children: [
                  /* @__PURE__ */ o(le, { htmlFor: "ck-country", children: "Country" }),
                  /* @__PURE__ */ o(
                    pe,
                    {
                      id: "ck-country",
                      required: !0,
                      placeholder: "United States",
                      value: k.country,
                      onChange: (b) => Q("country", b.target.value)
                    }
                  )
                ] }),
                p === "custom" && t && /* @__PURE__ */ u("div", { className: "sm:col-span-2 flex items-center gap-2 pt-1", children: [
                  /* @__PURE__ */ o(
                    "input",
                    {
                      type: "checkbox",
                      id: "ck-save-address",
                      checked: N,
                      onChange: (b) => I(b.target.checked),
                      className: "h-4 w-4 rounded border-gray-300 accent-primary"
                    }
                  ),
                  /* @__PURE__ */ u(le, { htmlFor: "ck-save-address", className: "text-sm font-normal cursor-pointer flex items-center gap-1.5", children: [
                    /* @__PURE__ */ o(Gt, { className: "h-3.5 w-3.5" }),
                    "Save this address for future orders"
                  ] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ u(de, { children: [
            /* @__PURE__ */ o(me, { children: /* @__PURE__ */ o(he, { className: "text-lg", children: "Payment Method" }) }),
            /* @__PURE__ */ u(fe, { className: "space-y-3", children: [
              /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  onClick: () => j("shopify"),
                  className: U(
                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                    w === "shopify" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/5"
                  ),
                  children: [
                    /* @__PURE__ */ o(Qe, { className: "h-5 w-5 shrink-0" }),
                    /* @__PURE__ */ u("div", { children: [
                      /* @__PURE__ */ o("p", { className: "font-medium", children: "Shopify Checkout" }),
                      /* @__PURE__ */ o("p", { className: "text-xs text-muted-foreground", children: "Credit / debit card via Shopify" })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  onClick: () => j("crypto"),
                  className: U(
                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                    w === "crypto" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/5"
                  ),
                  children: [
                    /* @__PURE__ */ o(Xt, { className: "h-5 w-5 shrink-0" }),
                    /* @__PURE__ */ u("div", { children: [
                      /* @__PURE__ */ o("p", { className: "font-medium", children: "Crypto Payment" }),
                      /* @__PURE__ */ o("p", { className: "text-xs text-muted-foreground", children: "Bitcoin, Ethereum, and more" })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ u(
                "button",
                {
                  type: "button",
                  onClick: () => j("stripe"),
                  className: U(
                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                    w === "stripe" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/5"
                  ),
                  children: [
                    /* @__PURE__ */ o(Qe, { className: "h-5 w-5 shrink-0" }),
                    /* @__PURE__ */ u("div", { children: [
                      /* @__PURE__ */ o("p", { className: "font-medium", children: "Stripe" }),
                      /* @__PURE__ */ o("p", { className: "text-xs text-muted-foreground", children: "Credit / debit card, Apple Pay, Google Pay" })
                    ] })
                  ]
                }
              ),
              w === "stripe" && c && s && /* @__PURE__ */ o("div", { className: "pt-2", style: { minHeight: 350, contain: "content", overflow: "hidden", maxWidth: "100%" }, children: /* @__PURE__ */ o(Ft, { stripe: c, options: { clientSecret: s }, children: /* @__PURE__ */ o(
                un,
                {
                  onPaymentSuccess: (b) => {
                    N && p === "custom" && t && t(k), m == null || m({
                      shipping: k,
                      paymentMethod: "stripe",
                      paymentIntent: b
                    });
                  },
                  returnUrl: h,
                  defaultEmail: k.email,
                  defaultName: k.fullName
                }
              ) }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ u("div", { className: "space-y-4", children: [
          /* @__PURE__ */ o(kr, { tax: i, shipping: l }),
          /* @__PURE__ */ o(ye, {}),
          w !== "stripe" && /* @__PURE__ */ o(re, { type: "submit", size: "lg", className: "w-full", children: "Place Order" }),
          r && /* @__PURE__ */ o(
            re,
            {
              type: "button",
              variant: "ghost",
              className: "w-full",
              onClick: r,
              children: "← Back to Cart"
            }
          ),
          /* @__PURE__ */ o(kt, { className: "pt-4" })
        ] })
      ]
    }
  ) });
}
function we({ title: e, children: t, className: r }) {
  return /* @__PURE__ */ o("div", { className: U("mx-auto max-w-3xl py-8", r), children: /* @__PURE__ */ u(de, { children: [
    /* @__PURE__ */ o(me, { children: /* @__PURE__ */ o(he, { className: "text-2xl", children: e }) }),
    /* @__PURE__ */ o(ye, {}),
    /* @__PURE__ */ o(fe, { className: "prose prose-sm dark:prose-invert max-w-none pt-6", children: t })
  ] }) });
}
const fn = [
  { region: "Domestic", method: "Standard", estimate: "5–7 business days", price: "$4.99" },
  { region: "Domestic", method: "Express", estimate: "2–3 business days", price: "$12.99" },
  { region: "International", method: "Standard", estimate: "10–20 business days", price: "$14.99" },
  { region: "International", method: "Express", estimate: "5–8 business days", price: "$29.99" }
];
function pn({ rates: e = fn, t, className: r }) {
  const n = t || ((a) => a);
  return /* @__PURE__ */ u(we, { title: n("Shipping Information"), className: r, children: [
    /* @__PURE__ */ o("div", { className: "not-prose mb-8 grid gap-4 sm:grid-cols-2", children: [
      { icon: Kt, label: n("Free shipping on orders over $75") },
      { icon: He, label: n("Same-day dispatch on orders before 2 PM") },
      { icon: Qt, label: n("We ship worldwide") },
      { icon: Zt, label: n("No hidden fees at checkout") }
    ].map(({ icon: a, label: i }) => /* @__PURE__ */ u(
      "div",
      {
        className: "flex items-center gap-3 rounded-lg border border-border/50 bg-accent/5 p-4",
        children: [
          /* @__PURE__ */ o(a, { className: "h-5 w-5 shrink-0 text-primary" }),
          /* @__PURE__ */ o("span", { className: "text-sm font-medium", children: i })
        ]
      },
      i
    )) }),
    /* @__PURE__ */ o("h3", { children: n("Shipping Rates") }),
    /* @__PURE__ */ o("div", { className: "not-prose overflow-x-auto", children: /* @__PURE__ */ u("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ o("thead", { children: /* @__PURE__ */ u("tr", { className: "border-b text-left text-muted-foreground", children: [
        /* @__PURE__ */ o("th", { className: "pb-2 pr-4 font-medium", children: n("Region") }),
        /* @__PURE__ */ o("th", { className: "pb-2 pr-4 font-medium", children: n("Method") }),
        /* @__PURE__ */ o("th", { className: "pb-2 pr-4 font-medium", children: n("Estimate") }),
        /* @__PURE__ */ o("th", { className: "pb-2 font-medium text-right", children: n("Price") })
      ] }) }),
      /* @__PURE__ */ o("tbody", { children: e.map((a, i) => /* @__PURE__ */ u("tr", { className: U("border-b border-border/30", i % 2 === 0 && "bg-accent/5"), children: [
        /* @__PURE__ */ o("td", { className: "py-2.5 pr-4", children: n(a.region) }),
        /* @__PURE__ */ o("td", { className: "py-2.5 pr-4", children: n(a.method) }),
        /* @__PURE__ */ o("td", { className: "py-2.5 pr-4 text-muted-foreground", children: a.estimate }),
        /* @__PURE__ */ o("td", { className: "py-2.5 text-right font-medium", children: a.price })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: n(
      "<h3>Processing Time</h3><p>Orders placed before 2:00 PM (local time) on business days are typically processed and shipped the same day. Orders placed after this cut-off or on weekends/holidays will be processed the next business day.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: n(
      "<h3>Tracking</h3><p>Once your order ships, you will receive a confirmation email with a tracking number. You can use this number to track your package on the carrier's website.</p>"
    ) } })
  ] });
}
function mn({ returnWindowDays: e = 30, t, className: r }) {
  const n = t || ((a) => a);
  return /* @__PURE__ */ u(we, { title: n("Returns & Refund Policy"), className: r, children: [
    /* @__PURE__ */ o("div", { className: "not-prose mb-8 grid gap-4 sm:grid-cols-2", children: [
      { icon: He, label: n(`${e}-day return window`) },
      { icon: er, label: n("Free returns on defective items") },
      { icon: De, label: n("Full refund to original payment") },
      { icon: Fe, label: n("No restocking fees") }
    ].map(({ icon: a, label: i }) => /* @__PURE__ */ u(
      "div",
      {
        className: "flex items-center gap-3 rounded-lg border border-border/50 bg-accent/5 p-4",
        children: [
          /* @__PURE__ */ o(a, { className: "h-5 w-5 shrink-0 text-primary" }),
          /* @__PURE__ */ o("span", { className: "text-sm font-medium", children: i })
        ]
      },
      i
    )) }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: n(
      `<h3>Eligibility</h3><p>Items must be returned within <strong>${e} days</strong> of delivery in their original, unused condition with all tags and packaging intact.</p>`
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: n(
      "<h3>How to Initiate a Return</h3><ol><li>Contact our support team with your order number.</li><li>Receive a prepaid return label (for defective items) or return instructions.</li><li>Ship the item back using the provided label or your preferred carrier.</li></ol>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: n(
      "<h3>Refund Processing</h3><p>Once we receive and inspect the returned item, your refund will be processed within 5–10 business days to your original payment method. You will receive an email confirmation when the refund has been issued.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: n(
      "<h3>Exceptions</h3><p>The following items are not eligible for return: gift cards, downloadable products, and items marked as final sale. Perishable goods cannot be returned unless they arrive damaged or defective.</p>"
    ) } })
  ] });
}
function hn({
  siteName: e = "Our Store",
  contactEmail: t = "privacy@example.com",
  t: r,
  className: n
}) {
  const a = r || ((i) => i);
  return /* @__PURE__ */ u(we, { title: a("Privacy Policy"), className: n, children: [
    /* @__PURE__ */ o("p", { dangerouslySetInnerHTML: { __html: a(
      `At <strong>${e}</strong>, privacy is not a checkbox — it is a core value. We believe you should be able to browse, shop, and interact with our platform without being tracked, profiled, or surveilled. We go beyond legal compliance to ensure your data is handled with the respect it deserves.`
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>Privacy by Design</h3><p>We have intentionally built our platform without invasive tracking technologies. There are no third-party analytics scripts, no advertising pixels, no behavioral profiling, and no cross-site tracking — not because the law requires it, but because we believe it is the right thing to do.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>Information We Collect</h3><ul><li><strong>Order information:</strong> name, email, shipping address, and payment details you provide during checkout — used solely to process and fulfill your orders.</li><li><strong>Account information:</strong> email and profile data if you create an account — used to manage your orders and preferences.</li><li><strong>Anonymized usage data:</strong> we collect basic, anonymized page-visit data (with IP addresses truncated) to understand how our site is used. This data cannot be used to identify you personally.</li></ul>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>What We Will Never Do</h3><ul><li>Sell, rent, or share your personal data with third parties for marketing or advertising.</li><li>Use third-party tracking scripts, analytics services, or advertising networks.</li><li>Use tracking pixels or monitor individual email opens and clicks.</li><li>Build advertising profiles or track you across other websites.</li><li>Monetize your data in any way.</li></ul>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>Cookies</h3><p>We use only essential, first-party cookies required for the site to function (e.g., keeping you logged in, maintaining your shopping cart). We do not set any third-party or advertising cookies.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>Data Sharing</h3><p>We share information only with service providers strictly necessary to fulfill your order (e.g., payment processors, shipping carriers) and as required by law. These providers are contractually obligated to protect your data.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      `<h3>Your Rights</h3><p>The only personal data we store is the shipping address you enter during checkout. You can request correction or deletion of this data at any time by contacting us at <a href="mailto:${t}" class="text-primary underline">${t}</a>. We will respond promptly.</p>`
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      `<h3>Contact Us</h3><p>If you have questions about this privacy policy, please contact us at <a href="mailto:${t}" class="text-primary underline">${t}</a>.</p>`
    ) } })
  ] });
}
function yn({
  siteName: e = "Our Store",
  contactEmail: t = "legal@example.com",
  t: r,
  className: n
}) {
  const a = r || ((i) => i);
  return /* @__PURE__ */ u(we, { title: a("Terms of Service"), className: n, children: [
    /* @__PURE__ */ o("p", { dangerouslySetInnerHTML: { __html: a(
      `By accessing and using <strong>${e}</strong>, you agree to be bound by these Terms of Service.`
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>Use of the Site</h3><p>You agree to use this site only for lawful purposes and in a manner that does not infringe on the rights of others or restrict their use and enjoyment of the site.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>Products &amp; Pricing</h3><p>All product descriptions and prices are subject to change without notice. We reserve the right to modify or discontinue any product at any time. Prices are displayed in the store's base currency and may exclude taxes and shipping costs, which are calculated at checkout.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>Orders &amp; Payment</h3><p>By placing an order, you make an offer to purchase the selected products. We reserve the right to refuse or cancel any order for any reason, including pricing errors or suspected fraud.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      `<h3>Intellectual Property</h3><p>All content on this site — including text, images, logos, and software — is the property of ${e} or its licensors and is protected by applicable intellectual property laws.</p>`
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      `<h3>Limitation of Liability</h3><p>To the fullest extent permitted by law, ${e} shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site or purchase of products.</p>`
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      "<h3>Changes to These Terms</h3><p>We may update these Terms of Service from time to time. Continued use of the site after changes constitutes acceptance of the revised terms.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: a(
      `<h3>Contact</h3><p>For questions about these terms, contact us at <a href="mailto:${t}" class="text-primary underline">${t}</a>.</p>`
    ) } })
  ] });
}
function vn({
  company: e = "Company Name",
  representative: t = "Representative Name",
  address: r = "Street, City, Country",
  email: n = "info@example.com",
  phone: a = "",
  vatId: i = "",
  register: l = "",
  responsibleContent: c = "",
  t: s,
  className: m
}) {
  const h = s || ((f) => f);
  return /* @__PURE__ */ u(we, { title: h("Impressum — Legal Disclosure"), className: m, children: [
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: h(
      `<h3>Information pursuant to § 5 DDG</h3><p><strong>${e}</strong><br/>${r}</p><p><strong>Represented by:</strong><br/>${t}</p>`
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: h(
      `<h3>Contact</h3><p>Email: <a href="mailto:${n}" class="text-primary underline">${n}</a>` + (a ? `<br/>Phone: ${a}` : "") + "</p>"
    ) } }),
    i && /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: h(
      `<h3>VAT ID</h3><p>VAT identification number pursuant to § 27a UStG:<br/><strong>${i}</strong></p>`
    ) } }),
    l && /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: h(
      `<h3>Commercial Register</h3><p>${l}</p>`
    ) } }),
    c && /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: h(
      `<h3>Responsible for Content</h3><p>${c}</p>`
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: h(
      '<h3>EU Dispute Resolution</h3><p>The European Commission provides a platform for online dispute resolution (ODR): <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" class="text-primary underline">https://ec.europa.eu/consumers/odr/</a>. We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>'
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: h(
      "<h3>Liability for Content</h3><p>As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to § 7(1) DDG. According to §§ 8 to 10 DDG, however, we are not obliged as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.</p>"
    ) } }),
    /* @__PURE__ */ o("div", { dangerouslySetInnerHTML: { __html: h(
      "<h3>Liability for Links</h3><p>Our website contains links to external third-party websites over whose content we have no influence. We therefore cannot accept any liability for this third-party content. The respective provider or operator of the linked pages is always responsible for the content of the linked pages.</p>"
    ) } })
  ] });
}
function xe(e) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? xe = function(t) {
    return typeof t;
  } : xe = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, xe(e);
}
var Wt = "clover", gn = function(t) {
  return t === 3 ? "v3" : t;
}, Ut = "https://js.stripe.com", bn = "".concat(Ut, "/").concat(Wt, "/stripe.js"), xn = /^https:\/\/js\.stripe\.com\/v3\/?(\?.*)?$/, wn = /^https:\/\/js\.stripe\.com\/(v3|[a-z]+)\/stripe\.js(\?.*)?$/, gt = "loadStripe.setLoadParameters was called but an existing Stripe.js script already exists in the document; existing script parameters will be used", Sn = function(t) {
  return xn.test(t) || wn.test(t);
}, Nn = function() {
  for (var t = document.querySelectorAll('script[src^="'.concat(Ut, '"]')), r = 0; r < t.length; r++) {
    var n = t[r];
    if (Sn(n.src))
      return n;
  }
  return null;
}, bt = function(t) {
  var r = t && !t.advancedFraudSignals ? "?advancedFraudSignals=false" : "", n = document.createElement("script");
  n.src = "".concat(bn).concat(r);
  var a = document.head || document.body;
  if (!a)
    throw new Error("Expected document.body not to be null. Stripe.js requires a <body> element.");
  return a.appendChild(n), n;
}, Cn = function(t, r) {
  !t || !t._registerWrapper || t._registerWrapper({
    name: "stripe-js",
    version: "8.8.0",
    startTime: r
  });
}, be = null, Ee = null, Pe = null, En = function(t) {
  return function(r) {
    t(new Error("Failed to load Stripe.js", {
      cause: r
    }));
  };
}, Pn = function(t, r) {
  return function() {
    window.Stripe ? t(window.Stripe) : r(new Error("Stripe.js not available"));
  };
}, _n = function(t) {
  return be !== null ? be : (be = new Promise(function(r, n) {
    if (typeof window > "u" || typeof document > "u") {
      r(null);
      return;
    }
    if (window.Stripe && t && console.warn(gt), window.Stripe) {
      r(window.Stripe);
      return;
    }
    try {
      var a = Nn();
      if (a && t)
        console.warn(gt);
      else if (!a)
        a = bt(t);
      else if (a && Pe !== null && Ee !== null) {
        var i;
        a.removeEventListener("load", Pe), a.removeEventListener("error", Ee), (i = a.parentNode) === null || i === void 0 || i.removeChild(a), a = bt(t);
      }
      Pe = Pn(r, n), Ee = En(n), a.addEventListener("load", Pe), a.addEventListener("error", Ee);
    } catch (l) {
      n(l);
      return;
    }
  }), be.catch(function(r) {
    return be = null, Promise.reject(r);
  }));
}, Tn = function(t, r, n) {
  if (t === null)
    return null;
  var a = r[0];
  if (typeof a != "string")
    throw new Error("Expected publishable key to be of type string, got type ".concat(xe(a), " instead."));
  var i = a.match(/^pk_test/), l = gn(t.version), c = Wt;
  i && l !== c && console.warn("Stripe.js@".concat(l, " was loaded on the page, but @stripe/stripe-js@").concat("8.8.0", " expected Stripe.js@").concat(c, ". This may result in unexpected behavior. For more information, see https://docs.stripe.com/sdks/stripejs-versioning"));
  var s = t.apply(void 0, r);
  return Cn(s, n), s;
}, xt = function(t) {
  var r = `invalid load parameters; expected object of shape

    {advancedFraudSignals: boolean}

but received

    `.concat(JSON.stringify(t), `
`);
  if (t === null || xe(t) !== "object")
    throw new Error(r);
  if (Object.keys(t).length === 1 && typeof t.advancedFraudSignals == "boolean")
    return t;
  throw new Error(r);
}, ke, Ye = !1, zt = function() {
  for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
    r[n] = arguments[n];
  Ye = !0;
  var a = Date.now();
  return _n(ke).then(function(i) {
    return Tn(i, r, a);
  });
};
zt.setLoadParameters = function(e) {
  if (Ye && ke) {
    var t = xt(e), r = Object.keys(t), n = r.reduce(function(a, i) {
      var l;
      return a && e[i] === ((l = ke) === null || l === void 0 ? void 0 : l[i]);
    }, !0);
    if (n)
      return;
  }
  if (Ye)
    throw new Error("You cannot change load parameters after calling loadStripe");
  ke = xt(e);
};
function kn({
  userId: e,
  userDisplayName: t,
  userEmail: r,
  onFetchAddresses: n,
  onSaveAddress: a,
  onPlaceOrder: i,
  onBackToCart: l,
  onOrderSuccess: c,
  toast: s,
  stripePublishableKey: m,
  apiBaseUrl: h = "",
  stripeReturnUrl: f,
  currency: g = "eur",
  getAuthToken: w,
  locale: j
}) {
  const [N, I] = ae([]), [S, ne] = ae(null), [k, W] = ae(null), p = se((q) => q.subtotal);
  return _e(() => {
    if (!e) return;
    let q = !0;
    return n(e).then((b) => {
      q && I(b);
    }).catch((b) => console.error("Failed to fetch addresses:", b)), () => {
      q = !1;
    };
  }, [e, n]), _e(() => {
    m && ne(zt(m, { locale: j || "auto" }));
  }, [m, j]), _e(() => {
    if (!m || p <= 0) return;
    let q = !0;
    const b = Math.round(p * 100);
    return (async () => {
      const Y = { "Content-Type": "application/json" };
      if (w) {
        const V = await w();
        V && (Y.Authorization = `Bearer ${V}`);
      }
      return (await fetch(`${h}/api/stripe/create-payment-intent`, {
        method: "POST",
        headers: Y,
        body: JSON.stringify({ amount: b, currency: g })
      })).json();
    })().then((Y) => {
      q && Y.clientSecret && W(Y.clientSecret);
    }).catch((Y) => console.error("Failed to create PaymentIntent:", Y)), () => {
      q = !1;
    };
  }, [m, h, p]), /* @__PURE__ */ o(
    dn,
    {
      onPlaceOrder: async (q) => {
        try {
          await i(q), s == null || s.success("Order placed successfully!"), c();
        } catch (b) {
          console.error("Failed to place order:", b), s == null || s.error("Failed to place order. Please try again.");
        }
      },
      onSaveAddress: async (q) => {
        var b;
        if (e)
          try {
            const z = await n(e), Y = {
              ...q,
              id: crypto.randomUUID(),
              label: ((b = q.address) == null ? void 0 : b.split(",")[0]) || "Checkout address",
              phone: "",
              note: "",
              // If it's the first address, make it default
              isDefault: z.length === 0
            }, ee = [...z, Y];
            await a(e, ee), I(ee), s == null || s.success("Address saved to your profile");
          } catch (z) {
            console.error("Failed to save address:", z), s == null || s.error("Failed to save address");
          }
      },
      onBackToCart: l,
      savedAddresses: N,
      initialShipping: {
        fullName: t ?? "",
        email: r ?? ""
      },
      stripePromise: S,
      stripeClientSecret: k,
      onStripePaymentSuccess: async (q) => {
        try {
          await i({
            shipping: q.shipping,
            paymentMethod: q.paymentMethod,
            // Store Stripe PaymentIntent ID for refunds/reconciliation
            external_order_id: q.paymentIntent.id,
            metadata: {
              stripe_payment_intent_id: q.paymentIntent.id,
              stripe_status: q.paymentIntent.status
            }
          }), s == null || s.success("Payment successful!"), await new Promise((b) => setTimeout(b, 2e3)), c();
        } catch (b) {
          console.error("Failed to record Stripe transaction:", b), s == null || s.error("Payment succeeded but failed to record transaction. Contact support.");
        }
      },
      stripeReturnUrl: f
    }
  );
}
const Rn = Be(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function On({ className: e, variant: t, ...r }) {
  return /* @__PURE__ */ o("div", { className: U(Rn({ variant: t }), e), ...r });
}
const wt = {
  pending: { label: "Pending", variant: "secondary", icon: /* @__PURE__ */ o(He, { className: "h-3.5 w-3.5" }) },
  processing: { label: "Processing", variant: "default", icon: /* @__PURE__ */ o(qe, { className: "h-3.5 w-3.5" }) },
  paid: { label: "Paid", variant: "default", icon: /* @__PURE__ */ o(De, { className: "h-3.5 w-3.5" }) },
  completed: { label: "Completed", variant: "default", icon: /* @__PURE__ */ o(De, { className: "h-3.5 w-3.5" }) },
  failed: { label: "Failed", variant: "destructive", icon: /* @__PURE__ */ o(Fe, { className: "h-3.5 w-3.5" }) },
  refunded: { label: "Refunded", variant: "outline", icon: /* @__PURE__ */ o(qe, { className: "h-3.5 w-3.5" }) },
  cancelled: { label: "Cancelled", variant: "destructive", icon: /* @__PURE__ */ o(Fe, { className: "h-3.5 w-3.5" }) }
};
function In({ onFetchTransactions: e, onNavigate: t, toast: r }) {
  const [n, a] = ae([]), [i, l] = ae(!0);
  return _e(() => {
    let c = !0;
    return l(!0), e().then((s) => {
      c && a(s);
    }).catch((s) => {
      console.error("Failed to load transactions:", s), r == null || r.error("Failed to load purchases");
    }).finally(() => {
      c && l(!1);
    }), () => {
      c = !1;
    };
  }, [e]), i ? /* @__PURE__ */ o("div", { className: "flex items-center justify-center py-24", children: /* @__PURE__ */ o(qe, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : /* @__PURE__ */ u("div", { className: "mx-auto max-w-4xl px-4 py-8 space-y-6", children: [
    /* @__PURE__ */ u("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ u("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ o(Ze, { className: "h-6 w-6" }),
        /* @__PURE__ */ o("h1", { className: "text-2xl font-bold", children: "My Purchases" })
      ] }),
      /* @__PURE__ */ u(re, { variant: "outline", size: "sm", onClick: () => t("/"), children: [
        /* @__PURE__ */ o(tr, { className: "h-4 w-4 mr-1" }),
        "Back"
      ] })
    ] }),
    n.length === 0 ? /* @__PURE__ */ o(de, { children: /* @__PURE__ */ u(fe, { className: "flex flex-col items-center justify-center py-16 gap-4", children: [
      /* @__PURE__ */ o(Ze, { className: "h-12 w-12 text-muted-foreground" }),
      /* @__PURE__ */ o("p", { className: "text-muted-foreground", children: "No purchases yet." }),
      /* @__PURE__ */ o(re, { variant: "outline", onClick: () => t("/"), children: "Browse Products" })
    ] }) }) : /* @__PURE__ */ o("div", { className: "space-y-4", children: n.map((c) => {
      const s = Array.isArray(c.product_info) ? c.product_info : [], m = wt[c.status] || wt.pending, h = new Date(c.created_at).toLocaleDateString(void 0, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      return /* @__PURE__ */ u(de, { className: "overflow-hidden", children: [
        /* @__PURE__ */ o(me, { className: "pb-3", children: /* @__PURE__ */ u("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
          /* @__PURE__ */ u("div", { className: "space-y-1", children: [
            /* @__PURE__ */ u(he, { className: "text-base", children: [
              "Order #",
              c.id.slice(0, 8)
            ] }),
            /* @__PURE__ */ o("p", { className: "text-xs text-muted-foreground", children: h })
          ] }),
          /* @__PURE__ */ u("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ u(On, { variant: m.variant, className: "flex items-center gap-1", children: [
              m.icon,
              m.label
            ] }),
            /* @__PURE__ */ u("span", { className: "font-semibold text-sm", children: [
              c.currency,
              " ",
              Number(c.total_amount).toFixed(2)
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ u(fe, { className: "pt-0", children: [
          /* @__PURE__ */ o("div", { className: "space-y-2", children: s.map((f, g) => /* @__PURE__ */ u(
            "div",
            {
              className: "flex items-center gap-3 p-2 rounded-lg bg-muted/30",
              children: [
                f.image && /* @__PURE__ */ o(
                  "img",
                  {
                    src: f.image,
                    alt: f.title,
                    className: "h-10 w-10 rounded object-cover shrink-0"
                  }
                ),
                /* @__PURE__ */ u("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ o("p", { className: "text-sm font-medium truncate", children: f.title || "Product" }),
                  /* @__PURE__ */ u("p", { className: "text-xs text-muted-foreground", children: [
                    "Qty: ",
                    f.quantity || 1,
                    f.variant && ` · ${f.variant}`,
                    " · ",
                    c.currency,
                    " ",
                    Number(f.price || 0).toFixed(2)
                  ] }),
                  f.vendorSlug && /* @__PURE__ */ u(
                    "a",
                    {
                      href: `/user/${f.vendorSlug}`,
                      onClick: (w) => {
                        w.preventDefault(), t(`/user/${f.vendorSlug}`);
                      },
                      className: "text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 cursor-pointer",
                      children: [
                        /* @__PURE__ */ o(rr, { className: "h-3 w-3" }),
                        f.vendorSlug
                      ]
                    }
                  )
                ] }),
                f.vendorSlug && f.pageSlug && /* @__PURE__ */ u(
                  "a",
                  {
                    href: `/user/${f.vendorSlug}/pages/${f.pageSlug}`,
                    onClick: (w) => {
                      w.preventDefault(), t(`/user/${f.vendorSlug}/pages/${f.pageSlug}`);
                    },
                    className: "text-primary hover:underline text-xs flex items-center gap-1 shrink-0 cursor-pointer",
                    children: [
                      "View",
                      /* @__PURE__ */ o(nr, { className: "h-3 w-3" })
                    ]
                  }
                )
              ]
            },
            g
          )) }),
          c.shipping_info && Object.keys(c.shipping_info).length > 0 && /* @__PURE__ */ u("div", { className: "mt-3 pt-3 border-t text-xs text-muted-foreground", children: [
            "Ships to: ",
            c.shipping_info.fullName,
            ", ",
            c.shipping_info.city,
            ", ",
            c.shipping_info.country
          ] }),
          c.metadata && (c.metadata.stripe_receipt_url || c.metadata.stripe_invoice_url) && /* @__PURE__ */ u("div", { className: "mt-3 pt-3 border-t flex items-center gap-4", children: [
            c.metadata.stripe_receipt_url && /* @__PURE__ */ u(
              "a",
              {
                href: c.metadata.stripe_receipt_url,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-xs text-primary hover:underline flex items-center gap-1",
                children: [
                  /* @__PURE__ */ o(ar, { className: "h-3.5 w-3.5" }),
                  "View Receipt"
                ]
              }
            ),
            c.metadata.stripe_invoice_url && /* @__PURE__ */ u(
              "a",
              {
                href: c.metadata.stripe_invoice_url,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-xs text-primary hover:underline flex items-center gap-1",
                children: [
                  /* @__PURE__ */ o(or, { className: "h-3.5 w-3.5" }),
                  "View Invoice"
                ]
              }
            )
          ] })
        ] })
      ] }, c.id);
    }) })
  ] });
}
const Wn = (e) => {
  var n, a, i, l;
  const { pathname: t } = lr(), r = e.t || ((c) => c);
  return ue("/cart/*", t) ? /* @__PURE__ */ o(Tr, { onCheckout: () => e.onNavigate("/checkout") }) : ue("/checkout/*", t) ? /* @__PURE__ */ o(
    kn,
    {
      userId: (n = e.user) == null ? void 0 : n.id,
      userDisplayName: (i = (a = e.user) == null ? void 0 : a.user_metadata) == null ? void 0 : i.display_name,
      userEmail: (l = e.user) == null ? void 0 : l.email,
      onFetchAddresses: e.onFetchAddresses,
      onSaveAddress: e.onSaveAddress,
      onPlaceOrder: e.onPlaceOrder,
      onBackToCart: () => e.onNavigate("/cart"),
      onOrderSuccess: () => e.onNavigate("/purchases"),
      toast: e.toast,
      stripePublishableKey: e.stripePublishableKey,
      apiBaseUrl: e.apiBaseUrl,
      stripeReturnUrl: e.stripeReturnUrl,
      currency: e.currency,
      getAuthToken: e.getAuthToken,
      locale: e.locale
    }
  ) : ue("/purchases/*", t) ? /* @__PURE__ */ o(
    In,
    {
      onFetchTransactions: e.onFetchTransactions,
      onNavigate: e.onNavigate,
      toast: e.toast
    }
  ) : ue("/shipping/*", t) ? /* @__PURE__ */ o(pn, { t: r }) : ue("/returns/*", t) ? /* @__PURE__ */ o(mn, { t: r }) : ue("/privacy/*", t) ? /* @__PURE__ */ o(hn, { siteName: e.siteName || "PolyMech", contactEmail: e.contactEmail || "privacy@polymech.org", t: r }) : ue("/terms/*", t) ? /* @__PURE__ */ o(yn, { siteName: e.siteName || "PolyMech", contactEmail: e.contactEmail || "legal@polymech.org", t: r }) : ue("/impressum/*", t) ? /* @__PURE__ */ o(vn, { ...e.impressum || {}, t: r }) : null;
};
export {
  xr as CartItemRow,
  Tr as CartPage,
  kn as CheckoutFlow,
  dn as CheckoutPage,
  Wn as EcommerceBundle,
  vn as ImpressumPage,
  kr as OrderSummary,
  kt as PolicyLinks,
  we as PolicyPage,
  hn as PrivacyPolicyPage,
  In as PurchasesList,
  mn as ReturnsPage,
  pn as ShippingPage,
  yn as TermsPage,
  se as useCartStore
};
//# sourceMappingURL=pm-ecommerce.es.js.map
