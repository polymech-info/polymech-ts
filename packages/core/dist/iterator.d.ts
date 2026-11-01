export declare namespace Iterable {
    function is<T = any>(thing: any): thing is Iterable<T>;
    function empty<T = any>(): Iterable<T>;
    function single<T>(element: T): Iterable<T>;
    function wrap<T>(iterableOrElement: Iterable<T> | T): Iterable<T>;
    function from<T>(iterable: Iterable<T> | undefined | null): Iterable<T>;
    function reverse<T>(array: Array<T>): Iterable<T>;
    function isEmpty<T>(iterable: Iterable<T> | undefined | null): boolean;
    function first<T>(iterable: Iterable<T>): T | undefined;
    function some<T>(iterable: Iterable<T>, predicate: (t: T, i: number) => unknown): boolean;
    function find<T, R extends T>(iterable: Iterable<T>, predicate: (t: T) => t is R): R | undefined;
    function find<T>(iterable: Iterable<T>, predicate: (t: T) => boolean): T | undefined;
    function filter<T, R extends T>(iterable: Iterable<T>, predicate: (t: T) => t is R): Iterable<R>;
    function filter<T>(iterable: Iterable<T>, predicate: (t: T) => boolean): Iterable<T>;
    function map<T, R>(iterable: Iterable<T>, fn: (t: T, index: number) => R): Iterable<R>;
    function flatMap<T, R>(iterable: Iterable<T>, fn: (t: T, index: number) => Iterable<R>): Iterable<R>;
    function concat<T>(...iterables: Iterable<T>[]): Iterable<T>;
    function reduce<T, R>(iterable: Iterable<T>, reducer: (previousValue: R, currentValue: T) => R, initialValue: R): R;
    /**
     * Returns an iterable slice of the array, with the same semantics as `array.slice()`.
     */
    function slice<T>(arr: ReadonlyArray<T>, from: number, to?: number): Iterable<T>;
    /**
     * Consumes `atMost` elements from iterable and returns the consumed elements,
     * and an iterable for the rest of the elements.
     */
    function consume<T>(iterable: Iterable<T>, atMost?: number): [T[], Iterable<T>];
    function asyncToArray<T>(iterable: AsyncIterable<T>): Promise<T[]>;
}
export interface IIterator<T> {
    next(): T;
}
export declare class ArrayIterator<T> implements IIterator<T> {
    private items;
    protected start: number;
    protected end: number;
    protected index: number;
    constructor(items: T[], start?: number, end?: number);
    first(): T;
    next(): T;
    protected current(): T;
}
export declare class ArrayNavigator<T> extends ArrayIterator<T> implements INavigator<T> {
    constructor(items: T[], start?: number, end?: number);
    current(): T;
    previous(): T;
    first(): T;
    last(): T;
    parent(): T;
}
export declare class MappedIterator<T, R> implements IIterator<R> {
    protected iterator: IIterator<T>;
    protected fn: (item: T) => R;
    constructor(iterator: IIterator<T>, fn: (item: T) => R);
    next(): R;
}
export interface INavigator<T> extends IIterator<T> {
    current(): T;
    previous(): T;
    parent(): T;
    first(): T;
    last(): T;
    next(): T;
}
export declare class MappedNavigator<T, R> extends MappedIterator<T, R> implements INavigator<R> {
    protected navigator: INavigator<T>;
    constructor(navigator: INavigator<T>, fn: (item: T) => R);
    current(): R;
    previous(): R;
    parent(): R;
    first(): R;
    last(): R;
    next(): R;
}
