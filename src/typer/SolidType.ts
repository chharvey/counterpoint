import {
	Set_hasEq,
} from './package.js';
import {
	SolidTypeIntersection,
	SolidTypeUnion,
	SolidTypeDifference,
	SolidObject,
} from './index.js';
import {solidObjectsIdentical} from './utils-private.js';



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
 * - SolidTypeList
 * - SolidTypeHash
 * - SolidTypeSet
 * - SolidTypeMap
 */
export abstract class SolidType {
	/** The Bottom Type, containing no values. */
	static get NEVER(): SolidTypeNever { return SolidTypeNever.INSTANCE }
	/** The Top Type, containing all values. */
	static get UNKNOWN(): SolidTypeUnknown { return SolidTypeUnknown.INSTANCE }
	/** The Void Type, representing a completion but not a value. */
	static get VOID(): SolidTypeVoid { return SolidTypeVoid.INSTANCE; }
	/**
	 * Intersect all the given types.
	 * @param types the types to intersect
	 * @returns the intersection
	 */
	static intersectAll(types: SolidType[]): SolidType {
		return types.reduce((a, b) => a.intersect(b));
	}
	/**
	 * Unions all the given types.
	 * @param types the types to union
	 * @returns the union
	 */
	static unionAll(types: SolidType[]): SolidType {
		return types.reduce((a, b) => a.union(b));
	};


	/**
	 * Whether this type has no values assignable to it,
	 * i.e., it is equal to the type `never`.
	 * Used internally for special cases of computations.
	 */
	readonly isBottomType: boolean = this.values.size === 0;
	/**
	 * Whether this type has all values assignable to it,
	 * i.e., it is equal to the type `unknown`.
	 * Used internally for special cases of computations.
	 */
	readonly isTopType: boolean = false;

	/**
	 * Construct a new SolidType object.
	 * @param isMutable Whether this type is `mutable`. Mutable objects may change fields/entries and call mutating methods.
	 * @param values    An enumerated set of values that are assignable to this type.
	 */
	constructor (
		readonly isMutable: boolean,
		readonly values:    ReadonlySet<SolidObject> = new Set(),
	) {
	}

	/**
	 * Return whether this type “includes” the value, i.e.,
	 * whether the value is assignable to this type.
	 * @param v the value to check
	 * @returns Is `v` assignable to this type?
	 */
	includes(v: SolidObject): boolean {
		return Set_hasEq(this.values, v, solidObjectsIdentical);
	}
	/**
	 * Return the type intersection of this type with another.
	 * @param t the other type
	 * @returns the type intersection
	 * @final
	 */
	intersect(t: SolidType): SolidType {
		/** 1-5 | `T  & never   == never` */
		if (t.isBottomType) { return SolidType.NEVER; }
		if (this.isBottomType) { return this }
		/** 1-6 | `T  & unknown == T` */
		if (t.isTopType) { return this; }
		if (this.isTopType) { return t; }
		/** 3-3 | `A <: B  <->  A  & B == A` */
		if (this.isSubtypeOf(t)) { return this }
		if (t.isSubtypeOf(this)) { return t }

		return this.intersect_do(t)
	}
	public intersect_do(t: SolidType): SolidType { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
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
		if (t.isBottomType) { return this; }
		if (this.isBottomType) { return t; }
		/** 1-8 | `T \| unknown == unknown` */
		if (t.isTopType) { return t; }
		if (this.isTopType) { return SolidType.UNKNOWN; }
		/** 3-4 | `A <: B  <->  A \| B == B` */
		if (this.isSubtypeOf(t)) { return t }
		if (t.isSubtypeOf(this)) { return this }

		return this.union_do(t)
	}
	public union_do(t: SolidType): SolidType { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		/** 2-1 | `A  & B == B  & A` */
		if (t instanceof SolidTypeIntersection) { return t.union(this); }

		return new SolidTypeUnion(this, t)
	}
	/**
	 * Return a new type that includes the values in this type that are not included in the argument type.
	 * @param t the other type
	 * @returns the type difference
	 * @final
	 */
	subtract(t: SolidType): SolidType {
		/** 4-1 | `A - B == A  <->  A & B == never` */
		if (this.intersect(t).isBottomType) { return this; }

		/** 4-2 | `A - B == never  <->  A <: B` */
		if (this.isSubtypeOf(t)) { return SolidType.NEVER; }

		if (t instanceof SolidTypeUnion) {
			return t.subtractedFrom(this);
		}

		return this.subtract_do(t);
	}
	public subtract_do(t: SolidType): SolidType { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		return new SolidTypeDifference(this, t);
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
		if (this.isBottomType) { return true; };
		/** 1-3 | `T       <: never  <->  T == never` */
		if (t.isBottomType) { return this.isBottomType; }
		/** 1-4 | `unknown <: T      <->  T == unknown` */
		if (this.isTopType) { return t.isTopType; };
		/** 1-2 | `T     <: unknown` */
		if (t.isTopType) { return true; }

		if (t instanceof SolidTypeIntersection) {
			return t.isSupertypeOf(this);
		}
		if (t instanceof SolidTypeUnion) {
			if (t.isNecessarilySupertypeOf(this)) { return true; }
		}
		if (t instanceof SolidTypeDifference) {
			return t.isSupertypeOf(this);
		}

		return this.isSubtypeOf_do(t)
	}
	public isSubtypeOf_do(t: SolidType): boolean { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		return !this.isBottomType && !!this.values.size // these checks are needed because this is called by `SolidObject.isSubtypeOf_do`
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
		return this.isMutable === t.isMutable && this.isSubtypeOf(t) && t.isSubtypeOf(this);
	}
	mutableOf(): SolidType {
		return this;
	}
}



/**
 * An Interface Type is a set of properties that a value must have.
 */
export class SolidTypeInterface extends SolidType {
	override readonly isBottomType: boolean = [...this.properties.values()].some((value) => value.isBottomType);
	override readonly isTopType: boolean = this.properties.size === 0;

	/**
	 * Construct a new SolidInterface object.
	 * @param properties a map of this type’s members’ names along with their associated types
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		private readonly properties: ReadonlyMap<string, SolidType>,
		is_mutable: boolean = false,
	) {
		super(is_mutable);
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
	override mutableOf(): SolidTypeInterface {
		return new SolidTypeInterface(this.properties, true);
	}
}



/**
 * Class for constructing the Bottom Type, the type containing no values.
 * @final
 */
class SolidTypeNever extends SolidType {
	static readonly INSTANCE: SolidTypeNever = new SolidTypeNever()

	override readonly isBottomType: boolean = true;
	override readonly isTopType: boolean = false;

	private constructor () {
		super(false);
	}

	override toString(): string {
		return 'never';
	}
	override includes(_v: SolidObject): boolean {
		return false
	}
	override equals(t: SolidType): boolean {
		return t.isBottomType;
	}
}



/**
 * Class for constructing the `void` type.
 * @final
 */
class SolidTypeVoid extends SolidType {
	static readonly INSTANCE: SolidTypeVoid = new SolidTypeVoid();

	override readonly isBottomType: boolean = false;
	override readonly isTopType: boolean = false;

	private constructor () {
		super(false);
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
 * Class for constructing the Top Type, the type containing all values.
 * @final
 */
class SolidTypeUnknown extends SolidType {
	static readonly INSTANCE: SolidTypeUnknown = new SolidTypeUnknown()

	override readonly isBottomType: boolean = false;
	override readonly isTopType: boolean = true;

	private constructor () {
		super(false);
	}

	override toString(): string {
		return 'unknown';
	}
	override includes(_v: SolidObject): boolean {
		return true
	}
	override equals(t: SolidType): boolean {
		return t.isTopType;
	}
}
