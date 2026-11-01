import { Split } from 'type-fest';
/**
 * Recursively pick the sub-object from T according to the array of keys in Keys.
 *
 * If Keys = ['address', 'coords', 'lat'],
 * we want to produce { address: { coords: { lat: number } } } at the type level.
 */
type DeepPickArray<T, Keys extends readonly string[]> = Keys extends [] ? T : Keys extends [infer Head, ...infer Tail] ? Head extends keyof T ? {
    [P in Head]: Tail extends string[] ? DeepPickArray<T[Head], Tail> : never;
} : never : never;
/**
 * Given a single path string (e.g. "address/coords/lat") and a separator (default = "."),
 * parse that path into an array via `Split`, then recursively pick the resulting type.
 */
type DeepPickOne<T, Path extends string, Sep extends string = "."> = DeepPickArray<T, Split<Path, Sep>>;
/**
 * If DeepPickOne<T, Path, Sep> yields `never` (meaning invalid path),
 * we allow a fallback type D (default = undefined).
 */
type DeepPickValue<T, Path extends string, Sep extends string = "/", D = undefined> = DeepPickOne<T, Path, Sep> extends infer R ? [R] extends [never] ? D : R : D;
export declare function pick<T, Path extends string, Sep extends string = "/", D = undefined>(obj: T, path: Path, options?: {
    separator?: Sep;
    defaultValue?: D;
}): DeepPickValue<T, Path, Sep, D>;
export {};
