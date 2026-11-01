var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _MemoryBackend_instances, _MemoryBackend_buckets, _MemoryBackend_findBucket;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toArray(v) {
    return Array.isArray(v) ? v : [v];
}
function setUnion(a, b) {
    return [...new Set([...a, ...b])];
}
function setDifference(a, b) {
    const set = new Set(b);
    return a.filter((x) => !set.has(x));
}
// ---------------------------------------------------------------------------
// MemoryBackend
// ---------------------------------------------------------------------------
export class MemoryBackend {
    constructor() {
        _MemoryBackend_instances.add(this);
        _MemoryBackend_buckets.set(this, {});
    }
    /** Expose raw data (used by FileBackend for serialisation). */
    get buckets() {
        return __classPrivateFieldGet(this, _MemoryBackend_buckets, "f");
    }
    set buckets(data) {
        __classPrivateFieldSet(this, _MemoryBackend_buckets, data, "f");
    }
    // -- Transaction lifecycle ------------------------------------------------
    begin() {
        return [];
    }
    async end(transaction) {
        for (const fn of transaction) {
            fn();
        }
    }
    async clean() {
        __classPrivateFieldSet(this, _MemoryBackend_buckets, {}, "f");
    }
    // -- Reads ----------------------------------------------------------------
    async get(bucket, key) {
        var _a, _b;
        return (_b = (_a = __classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[bucket]) === null || _a === void 0 ? void 0 : _a[key]) !== null && _b !== void 0 ? _b : [];
    }
    async union(bucket, keys) {
        const b = __classPrivateFieldGet(this, _MemoryBackend_instances, "m", _MemoryBackend_findBucket).call(this, bucket);
        if (!b)
            return [];
        const result = [];
        for (const key of keys) {
            const vals = b[String(key)];
            if (vals)
                result.push(...vals);
        }
        return [...new Set(result)];
    }
    async unions(buckets, keys) {
        const result = {};
        for (const bucket of buckets) {
            const b = __classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[bucket];
            if (!b) {
                result[bucket] = [];
                continue;
            }
            const merged = [];
            for (const key of keys) {
                const vals = b[String(key)];
                if (vals)
                    merged.push(...vals);
            }
            result[bucket] = [...new Set(merged)];
        }
        return result;
    }
    // -- Writes (queued in transaction) ---------------------------------------
    add(transaction, bucket, key, values) {
        const vals = toArray(values).map(String);
        transaction.push(() => {
            var _a, _b;
            var _c;
            (_a = (_c = __classPrivateFieldGet(this, _MemoryBackend_buckets, "f"))[bucket]) !== null && _a !== void 0 ? _a : (_c[bucket] = {});
            const existing = (_b = __classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[bucket][String(key)]) !== null && _b !== void 0 ? _b : [];
            __classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[bucket][String(key)] = setUnion(existing, vals);
        });
    }
    del(transaction, bucket, keys) {
        const keysArr = toArray(keys).map(String);
        transaction.push(() => {
            const b = __classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[bucket];
            if (!b)
                return;
            for (const k of keysArr) {
                delete b[k];
            }
        });
    }
    remove(transaction, bucket, key, values) {
        const vals = toArray(values).map(String);
        transaction.push(() => {
            const b = __classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[bucket];
            if (!b)
                return;
            const old = b[String(key)];
            if (old) {
                b[String(key)] = setDifference(old, vals);
            }
        });
    }
}
_MemoryBackend_buckets = new WeakMap(), _MemoryBackend_instances = new WeakSet(), _MemoryBackend_findBucket = function _MemoryBackend_findBucket(name) {
    if (__classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[name])
        return __classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[name];
    for (const key of Object.keys(__classPrivateFieldGet(this, _MemoryBackend_buckets, "f"))) {
        if (new RegExp(`^${key}$`).test(name)) {
            return __classPrivateFieldGet(this, _MemoryBackend_buckets, "f")[key];
        }
    }
    return undefined;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVtb3J5QmFja2VuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kYXRhL01lbW9yeUJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBV0EsOEVBQThFO0FBQzlFLFVBQVU7QUFDViw4RUFBOEU7QUFFOUUsU0FBUyxPQUFPLENBQUMsQ0FBUztJQUN0QixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsQ0FBVyxFQUFFLENBQVc7SUFDdEMsT0FBTyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsQ0FBVyxFQUFFLENBQVc7SUFDM0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkIsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRUQsOEVBQThFO0FBQzlFLGdCQUFnQjtBQUNoQiw4RUFBOEU7QUFFOUUsTUFBTSxPQUFPLGFBQWE7SUFBMUI7O1FBQ0ksaUNBQXdCLEVBQUUsRUFBQztJQWlIL0IsQ0FBQztJQS9HRywrREFBK0Q7SUFDL0QsSUFBSSxPQUFPO1FBQ1AsT0FBTyx1QkFBQSxJQUFJLDhCQUFTLENBQUM7SUFDekIsQ0FBQztJQUVELElBQUksT0FBTyxDQUFDLElBQWlCO1FBQ3pCLHVCQUFBLElBQUksMEJBQVksSUFBSSxNQUFBLENBQUM7SUFDekIsQ0FBQztJQUVELDRFQUE0RTtJQUU1RSxL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