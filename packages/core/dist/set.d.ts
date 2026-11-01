export declare class ArraySet<T> {
    private _elements;
    constructor(elements?: T[]);
    get size(): number;
    set(element: T): void;
    contains(element: T): boolean;
    unset(element: T): void;
    get elements(): T[];
}
