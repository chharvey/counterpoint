import * as xjs from 'extrajs'
import {SetEq} from '../core/index.js'
import type {SolidObject} from './SolidObject.js';



/**
 * Internal representation of an entry of a tuple or mapping type.
 * @property type     - the type value, a Solid Language Type
 * @property optional - is the entry optional on the collection?
 */
export type TypeEntry = {
	type:     SolidType,
	optional: boolean,
};



/**
 * A half-closed range of integers from min (inclusive) to max (exclusive).
 * @example
 * type T = [3, 7]; % a range of integers including 3, 4, 5, and 6.
 * @index 0 the minimum, inclusive
 * @index 1 the maximum, exclusive
 */
export type IntRange = [number, number];



/**
 * Parent class for all Solid Language Types.
 * Known subclasses:
 * - SolidTypeIntersection
 * - SolidTypeUnion
 * - SolidTypeInterface
 * - SolidTypeNever
 * - SolidTypeVoid
 * - SolidTypeConstant
 * - SolidTypeUnknown
 * - SolidTypeTuple
 * - SolidTypeRecord
 * - SolidTypeMapping
 */
export abstract class SolidType {
	/** The Bottom Type, containing no values. */
	static get NEVER(): SolidTypeNever { return SolidTypeNever.INSTANCE }
	/** The Top Type, containing all values. */
	static get UNKNOWN(): SolidTypeUnknown { return SolidTypeUnknown.INSTANCE }
	/** The Void Type, representing a completion but not a value. */
	static get VOID(): SolidTypeVoid { return SolidTypeVoid.INSTANCE; }
	/** Comparator function for `SolidType#values` set. */
	private static VALUE_COMPARATOR(a: SolidObject, b: SolidObject): boolean {
		return a.identical(b);
	}


	/**
	 * Whether this type has no values assignable to it,
	 * i.e., it is equal to the Bottom Type (`never`).
	 * Used internally for special cases of computations.
	 */
	readonly isEmpty: boolean;
	/**
	 * Whether this type has all values assignable to it,
	 * i.e., it is equal to the Top Type (`unknown`).
	 * Used internally for special cases of computations.
	 */
	readonly isUniverse: boolean;
	/** An enumerated set of values that are assignable to this type. */
	readonly values: ReadonlySet<SolidObject>;

	/**
	 * Construct a new SolidType object.
	 * @param values an enumerated set of values that are assignable to this type
	 */
	constructor (values: ReadonlySet<SolidObject> = new Set()) {
		this.values = new SetEq(SolidType.VALUE_COMPARATOR, values);
		this.isEmpty = this.values.size === 0;
		this.isUniverse = false;
	}

	/**
	 * Return whether this type “includes” the value, i.e.,
	 * whether the value is assignable to this type.
	 * @param v the value to check
	 * @returns Is `v` assignable to this type?
	 */
	includes(v: SolidObject): boolean {
		return this.values.has(v)
	}
	/**
	 * Return the type intersection of this type with another.
	 * @param t the other type
	 * @returns the type intersection
	 * @final
	 */
	intersect(t: SolidType): SolidType {
		/** 1-5 | `T  & never   == never` */
		if (t.isEmpty) { return SolidType.NEVER; }
		if (this.isEmpty) { return this }
		/** 1-6 | `T  & unknown == T` */
		if (t.isUniverse) { return this }
		if (this.isUniverse) { return t }

		/** 3-3 | `A <: B  <->  A  & B == A` */
		if (this.isSubtypeOf(t)) { return this }
		if (t.isSubtypeOf(this)) { return t }

		return this.intersect_do(t)
	}
	intersect_do(t: SolidType): SolidType { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		/** 2-2 | `A \| B == B \| A` */
		if (t instanceof SolidTypeUnion) { return t.intersect(this); }

		return new SolidTypeIntersection(this, t)
	}
	/**
	 * Return the type union of this type with another.
	 * @param t the other type
	 * @returns the type union
	 * @final
	 */
	union(t: SolidType): SolidType {
		/** 1-7 | `T \| never   == T` */
		if (t.isEmpty) { return this }
		if (this.isEmpty) { return t }
		/** 1-8 | `T \| unknown == unknown` */
		if (t.isUniverse) { return t }
		if (this.isUniverse) { return this }

		/** 3-4 | `A <: B  <->  A \| B == B` */
		if (this.isSubtypeOf(t)) { return t }
		if (t.isSubtypeOf(this)) { return this }

		return this.union_do(t)
	}
	union_do(t: SolidType): SolidType { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		/** 2-1 | `A  & B == B  & A` */
		if (t instanceof SolidTypeIntersection) { return t.union(this); }

		return new SolidTypeUnion(this, t)
	}
	/**
	 * Return whether this type is a structural subtype of the given type.
	 * @param t the type to compare
	 * @returns Is this type a subtype of the argument?
	 * @final
	 */
	isSubtypeOf(t: SolidType): boolean {
		/** 2-7 | `A <: A` */
		if (this === t) { return true }
		/** 1-1 | `never <: T` */
		if (this.isEmpty) { return true; };
		/** 1-3 | `T       <: never  <->  T == never` */
		if (t.isEmpty) { return this.isEmpty }
		/** 1-4 | `unknown <: T      <->  T == unknown` */
		if (this.isUniverse) { return t.isUniverse; };
		/** 1-2 | `T     <: unknown` */
		if (t.isUniverse) { return true }

		if (t instanceof SolidTypeIntersection) {
			return t.isSupertypeOf(this);
		}
		if (t instanceof SolidTypeUnion) {
			if (t.isNecessarilySupertypeOf(this)) { return true; }
		}

		return this.isSubtypeOf_do(t)
	}
	isSubtypeOf_do(t: SolidType): boolean { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		return !this.isEmpty && !!this.values.size // these checks are needed because this is called by `SolidObject.isSubtypeOf_do`
			&& [...this.values].every((v) => t.includes(v));
	}
	/**
	 * Return whether this type is structurally equal to the given type.
	 * Two types are structurally equal if they are subtypes of each other.
	 *
	 * 2-8 | `A <: B  &&  B <: A  -->  A == B`
	 * @param t the type to compare
	 * @returns Is this type equal to the argument?
	 */
	equals(t: SolidType): boolean {
		return this.isSubtypeOf(t) && t.isSubtypeOf(this)
	}
}



/**
 * A type intersection of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 */
class SolidTypeIntersection extends SolidType {
	declare readonly isEmpty: boolean;

	/**
	 * Construct a new SolidTypeIntersection object.
	 * @param left the first type
	 * @param right the second type
	 */
	constructor (
		private readonly left:  SolidType,
		private readonly right: SolidType,
	) {
		super(xjs.Set.intersection(left.values, right.values))
		this.isEmpty = this.left.isEmpty || this.right.isEmpty || this.isEmpty;
	}

	override toString(): string {
		return `${ this.left } & ${ this.right }`;
	}
	override includes(v: SolidObject): boolean {
		return this.left.includes(v) && this.right.includes(v)
	}
	/**
	 * 2-6 | `A \| (B  & C) == (A \| B)  & (A \| C)`
	 *     |  (B  & C) \| A == (B \| A)  & (C \| A)
	 */
	override union_do(t: SolidType): SolidType {
		return (this.left.equals(SolidType.VOID) || this.right.equals(SolidType.VOID))
			? this.left.union(t).intersect(this.right.union(t))
			: new SolidTypeUnion(this, t);
	}
	override isSubtypeOf_do(t: SolidType): boolean {
		/** 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.left.isSubtypeOf(t) || this.right.isSubtypeOf(t)) { return true }
		/** 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (t.equals(this.left) || t.equals(this.right)) { return true }
		return super.isSubtypeOf_do(t)
	}
	isSupertypeOf(t: SolidType): boolean {
		/** 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
		return t.isSubtypeOf(this.left) && t.isSubtypeOf(this.right);
	}
}



/**
 * A type union of two types `T` and `U` is the type
 * that contains values both assignable to `T` *and* assignable to `U`.
 */
class SolidTypeUnion extends SolidType {
	declare readonly isEmpty: boolean;

	/**
	 * Construct a new SolidTypeUnion object.
	 * @param left the first type
	 * @param right the second type
	 */
	constructor (
		private readonly left:  SolidType,
		private readonly right: SolidType,
	) {
		super(xjs.Set.union(left.values, right.values))
		this.isEmpty = this.left.isEmpty && this.right.isEmpty;
	}

	override toString(): string {
		return `${ this.left } | ${ this.right }`;
	}
	override includes(v: SolidObject): boolean {
		return this.left.includes(v) || this.right.includes(v)
	}
	/**
	 * 2-5 | `A  & (B \| C) == (A  & B) \| (A  & C)`
	 *     |  (B \| C)  & A == (B  & A) \| (C  & A)
	 */
	override intersect_do(t: SolidType): SolidType {
		return (this.left.equals(SolidType.VOID) || this.right.equals(SolidType.VOID))
			? this.left.intersect(t).union(this.right.intersect(t))
			: new SolidTypeIntersection(this, t);
	}
	override isSubtypeOf_do(t: SolidType): boolean {
		/** 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.left.isSubtypeOf(t) && this.right.isSubtypeOf(t)
	}
	isNecessarilySupertypeOf(t: SolidType): boolean {
		/** 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D` */
		if (t.isSubtypeOf(this.left) || t.isSubtypeOf(this.right)) { return true; }
		/** 3-2 | `A <: A \| B  &&  B <: A \| B` */
		if (t.equals(this.left) || t.equals(this.right)) { return true; }
		return false;
	}
}



/**
 * An Interface Type is a set of properties that a value must have.
 */
export class SolidTypeInterface extends SolidType {
	override readonly isEmpty: boolean = [...this.properties.values()].some((value) => value.isEmpty)
	override readonly isUniverse: boolean = this.properties.size === 0

	/**
	 * Construct a new SolidInterface object.
	 * @param properties a map of this type’s members’ names along with their associated types
	 */
	constructor (private readonly properties: ReadonlyMap<string, SolidType>) {
		super()
	}

	override includes(v: SolidObject): boolean {
		return [...this.properties.keys()].every((key) => key in v)
	}
	/**
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type intersection is taken.
	 */
	override intersect_do(t: SolidTypeInterface): SolidTypeInterface {
		const props: Map<string, SolidType> = new Map([...this.properties]);
		;[...t.properties].forEach(([name, type_]) => {
			props.set(name, (props.has(name)) ? props.get(name)!.intersect(type_) : type_)
		})
		return new SolidTypeInterface(props)
	}
	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type union is taken.
	 */
	override union_do(t: SolidTypeInterface): SolidTypeInterface {
		const props: Map<string, SolidType> = new Map();
		;[...this.properties].forEach(([name, type_]) => {
			if (t.properties.has(name)) {
				props.set(name, type_.union(t.properties.get(name)!))
			}
		})
		return new SolidTypeInterface(props)
	}
	/**
	 * In the general case, `S` is a subtype of `T` if every property of `T` exists in `S`,
	 * and for each of those properties `#prop`, the type of `S#prop` is a subtype of `T#prop`.
	 * In other words, `S` is a subtype of `T` if the set of properties on `T` is a subset of the set of properties on `S`.
	 */
	override isSubtypeOf_do(t: SolidTypeInterface) {
		return [...t.properties].every(([name, type_]) =>
			this.properties.has(name) && this.properties.get(name)!.isSubtypeOf(type_)
		)
	}
}



/**
 * Class for constructing the Bottom Type, the type containing no values.
 */
class SolidTypeNever extends SolidType {
	static readonly INSTANCE: SolidTypeNever = new SolidTypeNever()

	override readonly isEmpty: boolean = true
	override readonly isUniverse: boolean = false

	private constructor () {
		super()
	}

	override toString(): string {
		return 'never';
	}
	override includes(_v: SolidObject): boolean {
		return false
	}
	override equals(t: SolidType): boolean {
		return t.isEmpty
	}
}



/**
 * Class for constructing the `void` type.
 * @final
 */
class SolidTypeVoid extends SolidType {
	static readonly INSTANCE: SolidTypeVoid = new SolidTypeVoid();

	override readonly isEmpty: boolean = false;
	override readonly isUniverse: boolean = false;

	private constructor () {
		super();
	}

	override toString(): string {
		return 'void';
	}
	override includes(_v: SolidObject): boolean {
		return false;
	}
	override intersect_do(_t: SolidType): SolidType {
		return SolidType.NEVER;
	}
	override isSubtypeOf_do(_t: SolidType): boolean {
		return false;
	}
	override equals(t: SolidType): boolean {
		return t === SolidTypeVoid.INSTANCE || super.equals(t);
	}
}



/**
 * Class for constructing constant types / unit types, types that contain one value.
 */
export class SolidTypeConstant extends SolidType {
	override readonly isEmpty: boolean = false
	override readonly isUniverse: boolean = false

	constructor (readonly value: SolidObject) {
		super(new Set([value]))
	}

	override toString(): string {
		return this.value.toString();
	}
	override includes(v: SolidObject): boolean {
		return this.value.equal(v);
	}
	override isSubtypeOf_do(t: SolidType): boolean {
		return t instanceof Function && this.value instanceof t || t.includes(this.value)
	}
}



/**
 * Class for constructing the Top Type, the type containing all values.
 */
class SolidTypeUnknown extends SolidType {
	static readonly INSTANCE: SolidTypeUnknown = new SolidTypeUnknown()

	override readonly isEmpty: boolean = false
	override readonly isUniverse: boolean = true

	private constructor () {
		super()
	}

	override toString(): string {
		return 'unknown';
	}
	override includes(_v: SolidObject): boolean {
		return true
	}
	override equals(t: SolidType): boolean {
		return t.isUniverse
	}
}
