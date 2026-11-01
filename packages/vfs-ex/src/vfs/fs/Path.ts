import { isString } from '@polymech/core/primitives'
import { deepClone as clone } from '@polymech/core/objects'

export const slash = (str: string) => {
	const isExtendedLengthPath = /^\\\\\?\\/.test(str);
	const hasNonAscii = /[^\x00-\x80]+/.test(str);

	if (isExtendedLengthPath || hasNonAscii) {
		return str;
	}

	return str.replace(/\\/g, '/');
};

export class Path {
	path: string;
	segments: string[];
	hasLeading: boolean;
	hasTrailing: boolean;
	extension: string;
	_parentPath: Path;
	static EMPTY: Path = new Path('');
	static normalize(path: string): string {
		return slash(path).replace(/\/+/g, '\/');
	}
	constructor(path: string | string[] = '.', hasLeading = false, hasTrailing = false) {
		if (isString(path)) {
			this.path = path as string;
			this.getSegments();
		} else {
			this.segments = path as string[];
			this.hasLeading = hasLeading;
			this.hasTrailing = hasTrailing;
		}
	}

	endsWith(tail): boolean {
		const segments = clone(this.segments);
		const tailSegments = (new Path(tail)).getSegments();
		while (tailSegments.length > 0 && segments.length > 0) {
			if (tailSegments.pop() !== segments.pop()) {
				return false;
			}
		}
		return true;
	}
	getExtension(): string {
		if (!this.extension) {
			this.extension = this.path.substr(this.path.lastIndexOf('.') + 1);
		}
		return this.extension;
	}
	segment(index): string {
		const segs = this.getSegments();
		if (segs.length < index) {
			return null;
		}
		return segs[index];
	}

	/**
	 * Return all items under this path
	 * @param items {String[]}
	 * @param recursive {boolean}
	 * @returns {String[]}
	 */
	getChildren(items: string[], recursive = false) {
		const result = [];
		const 
			path = this.toString();

		const addChild = (child) => {
			const _path = typeof child !== 'string' ? child.toString() : child;
			if (_path !== path && result.indexOf(_path) === -1) {
				result.push(_path);
			}
		};

		items.forEach((item) => {
			const child = new Path(item);
			// root match
			if (child.startsWith(this)) {
				if (recursive) {
					addChild(child.toString());
				} else {

					const diff = child.relativeTo(path);
					if (diff) {
						const diffSegments = diff.getSegments();
						// direct child
						if (diffSegments.length === 1) {
							addChild(child);
						} else if (diffSegments.length > 1) {

							// make sure that its parent has been added:
							const parent = child.getParentPath();
							const parentDiff = parent.relativeTo(path);

							// check diff again
							if (parentDiff.getSegments().length === 1) {
								addChild(parent.toString());
							}
						}
					}
				}

			}
		});
		return result;
	}

	getSegments(): string[] {
		if (!this.segments) {
			const path = this.path;
			this.segments = path.split('/');
			if (path.charAt(0) === '/') {
				this.hasLeading = true;
			}
			if (path.charAt(path.length - 1) === '/') {
				this.hasTrailing = true;
				// If the path ends in '/', split() will create an array whose last element
				// is an empty string. Remove that here.
				this.segments.pop();
			}
			this._canonicalize();
		}
		return this.segments;
	}

	isAbsolute(): boolean {
		return this.hasLeading;
	}

	getParentPath(): Path {
		if (!this._parentPath) {
			const parentSegments = clone(this.segments);
			parentSegments.pop();
			this._parentPath = new Path(parentSegments, this.hasLeading);
		}
		return this._parentPath;
	}

	_clone(): Path {
		return new Path(clone(this.segments), this.hasLeading, this.hasTrailing);
	}

	append(tail: string | Path): Path {
		tail = tail || '';
		if (typeof tail === 'string') {
			tail = new Path(tail);
		}
		if (tail.isAbsolute()) {
			return tail;
		}
		const mySegments = this.segments;
		const tailSegments = tail.getSegments();
		const newSegments = mySegments.concat(tailSegments);
		const result = new Path(newSegments, this.hasLeading, tail.hasTrailing);
		if (tailSegments[0] === '..' || tailSegments[0] === '.') {
			result._canonicalize();
		}
		return result;
	}
	toString(): string {
		const result = [];
		if (this.hasLeading) {
			result.push('/');
		}
		for (let i = 0; i < this.segments.length; i++) {
			if (i > 0) {
				result.push('/');
			}
			result.push(this.segments[i]);
		}
		if (this.hasTrailing) {
			result.push('/');
		}
		return result.join('').replace(/\/+/g, '\/');
	}

	_toString(): string {
		const result = [];
		if (this.hasLeading) {
			result.push('/');
		}
		for (let i = 0; i < this.segments.length; i++) {
			if (i > 0) {
				result.push('/');
			}
			result.push(this.segments[i]);
		}
		if (this.hasTrailing) {
			result.push('/');
		}
		return result.join('');
	}

	removeRelative(): Path {
		const segs = this.getSegments();
		if (segs.length > 0 && segs[1] === '.') {
			return this.removeFirstSegments(1);
		}
		return this;
	}

	relativeTo(base: string | Path, ignoreFilename = false) {
		if (typeof base === 'string') {
			base = new Path(base);
		}
		const mySegments = this.segments;
		if (this.isAbsolute()) {
			return this;
		}
		const baseSegments = base.getSegments();
		const commonLength = this.matchingFirstSegments(base);
		let baseSegmentLength = baseSegments.length;
		if (ignoreFilename) {
			baseSegmentLength = baseSegmentLength - 1;
		}
		const differenceLength = baseSegmentLength - commonLength;
		const newSegmentLength = differenceLength + mySegments.length - commonLength;
		if (newSegmentLength === 0) {
			return Path.EMPTY;
		}
		const newSegments = [];
		for (let i = 0; i < differenceLength; i++) {
			newSegments.push('..');
		}
		for (let i = commonLength; i < mySegments.length; i++) {
			newSegments.push(mySegments[i]);
		}
		return new Path(newSegments, false, this.hasTrailing);
	}

	startsWith(anotherPath: Path) {
		const count = this.matchingFirstSegments(anotherPath as Path);
		return anotherPath._length() === count;
	}
	_length(): number {
		return this.segments.length;
	}
	matchingFirstSegments(anotherPath: Path) {
		const mySegments = this.segments;
		const pathSegments = anotherPath.getSegments();
		const max = Math.min(mySegments.length, pathSegments.length);
		let count = 0;
		for (let i = 0; i < max; i++) {
			if (mySegments[i] !== pathSegments[i]) {
				return count;
			}
			count++;
		}
		return count;
	}
	removeFirstSegments(count: number): Path {
		return new Path(this.segments.slice(count, this.segments.length), this.hasLeading, this.hasTrailing);
	}
	removeMatchingLastSegments(anotherPath: Path): Path {
		const match = this.matchingFirstSegments(anotherPath);
		return this.removeLastSegments(match);
	}
	removeMatchingFirstSegments(anotherPath: Path): Path {
		const match = this.matchingFirstSegments(anotherPath);
		return this._clone().removeFirstSegments(match);
	}
	removeLastSegments(count: number): Path {
		if (!count) {
			count = 1;
		}
		return new Path(this.segments.slice(0, this.segments.length - count), this.hasLeading, this.hasTrailing);
	}
	lastSegment(): string {
		return this.segments[this.segments.length - 1];
	}
	firstSegment(length: number): string {
		return this.segments[length || 0];
	}
	equals(anotherPath): boolean {
		if (this.segments.length !== anotherPath.segments.length) {
			return false;
		}
		for (let i = 0; i < this.segments.length; i++) {
			if (anotherPath.segments[i] !== this.segments[i]) {
				return false;
			}
		}
		return true;
	}
	_canonicalize(): void {
		let doIt;
		const segments = this.segments;
		for (let i = 0; i < segments.length; i++) {
			if (segments[i] === '.' || segments[i] === '..') {
				doIt = true;
				break;
			}
		}
		if (doIt) {
			const stack = [];
			for (let i = 0; i < segments.length; i++) {
				if (segments[i] === '..') {
					if (stack.length === 0) {
						// if the stack is empty we are going out of our scope
						// so we need to accumulate segments.  But only if the original
						// path is relative.  If it is absolute then we can't go any higher than
						// root so simply toss the .. references.
						if (!this.hasLeading) {
							stack.push(segments[i]); // stack push
						}
					} else {
						// if the top is '..' then we are accumulating segments so don't pop
						if ('..' === stack[stack.length - 1]) {
							stack.push('..');
						} else {
							stack.pop();
						}
					}
					// collapse current references
				} else if (segments[i] !== '.' || this.segments.length === 1) {
					stack.push(segments[i]); // stack push
				}
			}
			// if the number of segments hasn't changed, then no modification needed
			if (stack.length === segments.length) {
				return;
			}
			this.segments = stack;
		}
	}
}
