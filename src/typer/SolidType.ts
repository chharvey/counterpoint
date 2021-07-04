import * as xjs from 'extrajs'
import {
	strictEqual,
} from '../decorators.js';
import type {SolidObject} from './SolidObject.js';



/**
 * Parent class for all Solid Language Types.
 * Known subclasses:
 * - SolidTypeIntersection
 * - SolidTypeUnion
 * - SolidTypeInterface
 * - SolidTypeNever
 * - SolidTypeConstant
 * - SolidTypeUnknown
 * - SolidTypeTuple
 * - SolidTypeRecord
 */
export abstract class SolidType {
	/** The Bottom Type, containing no values. */
	static get NEVER(): SolidTypeNever { return SolidTypeNever.INSTANCE }
	/** The Top Type, containing all values. */
	static get UNKNOWN(): SolidTypeUnknown { return SolidTypeUnknown.INSTANCE }
	/**
	 * Decorator for {@link SolidLanguageType#intersect} method and any overrides.
	 * Contains shortcuts for constructing type intersections.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static intersectDeco(
		_prototype: SolidType,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: SolidType, t: SolidType) => SolidType>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (t) {
			/** 1-5 | `T  & never   == never` */
			if (t.isEmpty) { return SolidType.NEVER }
			if (this.isEmpty) { return this }
			/** 1-6 | `T  & unknown == T` */
			if (t.isUniverse) { return this }
			if (this.isUniverse) { return t }

			/** 3-3 | `A <: B  <->  A  & B == A` */
			if (this.isSubtypeOf(t)) { return this }
			if (t.isSubtypeOf(this)) { return t }

			return method.call(this, t);
		};
		return descriptor;
	}
	/**
	 * Decorator for {@link SolidLanguageType#union} method and any overrides.
	 * Contains shortcuts for constructing type unions.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	protected static unionDeco(
		_prototype: SolidType,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: SolidType, t: SolidType) => SolidType>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (t) {
			/** 1-7 | `T \| never   == T` */
			if (t.isEmpty) { return this }
			if (this.isEmpty) { return t }
			/** 1-8 | `T \| unknown == unknown` */
			if (t.isUniverse) { return t }
			if (this.isUniverse) { return this }

			/** 3-4 | `A <: B  <->  A \| B == B` */
			if (this.isSubtypeOf(t)) { return t }
			if (t.isSubtypeOf(this)) { return this }

			return method.call(this, t);
		};
		return descriptor;
	}
	/**
	 * Decorator for {@link SolidLanguageType#isSubtypeOf} method and any overrides.
	 * Contains shortcuts for determining subtypes.
	 * @param   _prototype    the prototype that has the method to be decorated
	 * @param   _property_key the name of the method to be decorated
	 * @param   descriptor    the Property Descriptor of the prototype’s method
	 * @returns               `descriptor`, with a new value that is the decorated method
	 */
	static subtypeDeco( // must be public because accessed in SolidObject.ts
		_prototype: SolidType,
		_property_key: string,
		descriptor: TypedPropertyDescriptor<(this: SolidType, t: SolidType) => boolean>,
	): typeof descriptor {
		const method = descriptor.value!;
		descriptor.value = function (t) {
			/** 2-7 | `A <: A` */
			if (this === t) { return true };
			/** 1-1 | `never <: T` */
			if (this.isEmpty) { return true; };
			/** 1-3 | `T       <: never  <->  T == never` */
			if (t.isEmpty) { return this.isEmpty }
			/** 1-4 | `unknown <: T      <->  T == unknown` */
			if (this.isUniverse) { return t.isUniverse; };
			/** 1-2 | `T     <: unknown` */
			if (t.isUniverse) { return true };

			if (t instanceof SolidTypeIntersection) {
				/** 3-5 | `A <: C    &&  A <: D  <->  A <: C  & D` */
				return this.isSubtypeOf(t.left) && this.isSubtypeOf(t.right)
			}
			if (t instanceof SolidTypeUnion) {
				/** 3-6 | `A <: C  \|\|  A <: D  -->  A <: C \| D` */
				if (this.isSubtypeOf(t.left) || this.isSubtypeOf(t.right)) { return true }
				/** 3-2 | `A <: A \| B  &&  B <: A \| B` */
				if (this.equals(t.left) || this.equals(t.right)) { return true }
			}

			return method.call(this, t);
		};
		return descriptor;
	}


	/**
	 * Whether this type has no values assignable to it,
	 * i.e., it is equal to the Bottom Type (`never`).
	 * Used internally for special cases of computations.
	 */
	readonly isEmpty: boolean = this.values.size === 0
	/**
	 * Whether this type has all values assignable to it,
	 * i.e., it is equal to the Top Type (`unknown`).
	 * Used internally for special cases of computations.
	 */
	readonly isUniverse: boolean = false // this.equals(SolidType.UNKNOWN)

	/**
	 * Construct a new SolidType object.
	 * @param values an enumerated set of values that are assignable to this type
	 */
	constructor (
		readonly values: ReadonlySet<SolidObject> = new Set(),
	) {
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
	 */
	@SolidType.intersectDeco
	intersect(t: SolidType): SolidType {
		return new SolidTypeIntersection(this, t)
	}
	/**
	 * Return the type union of this type with another.
	 * @param t the other type
	 * @returns the type union
	 */
	@SolidType.unionDeco
	union(t: SolidType): SolidType {
		return new SolidTypeUnion(this, t)
	}
	/**
	 * Return whether this type is a structural subtype of the given type.
	 * @param t the type to compare
	 * @returns Is this type a subtype of the argument?
	 */
	@strictEqual
	@SolidType.subtypeDeco
	isSubtypeOf(t: SolidType): boolean {
		return !this.isEmpty && !!this.values.size && [...this.values].every((v) => t.includes(v));
	}
	/**
	 * Return whether this type is structurally equal to the given type.
	 * Two types are structurally equal if they are subtypes of each other.
	 *
	 * 2-8 | `A <: B  &&  B <: A  -->  A == B`
	 * @param t the type to compare
	 * @returns Is this type equal to the argument?
	 */
	@strictEqual
	equals(t: SolidType): boolean {
		return this.isSubtypeOf(t) && t.isSubtypeOf(this)
	}
}



/**
 * A type intersection of two types `T` and `U` is the type
 * that contains values either assignable to `T` *or* assignable to `U`.
 */
class SolidTypeIntersection extends SolidType {
	/**
	 * Construct a new SolidTypeIntersection object.
	 * @param left the first type
	 * @param right the second type
	 */
	constructor (
		readonly left:  SolidType,
		readonly right: SolidType,
	) {
		super(xjs.Set.intersection(left.values, right.values))
	}

	override toString(): string {
		return `${ this.left } & ${ this.right }`;
	}
	override includes(v: SolidObject): boolean {
		return this.left.includes(v) && this.right.includes(v)
	}
	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		/** 3-8 | `A <: C  \|\|  B <: C  -->  A  & B <: C` */
		if (this.left.isSubtypeOf(t) || this.right.isSubtypeOf(t)) { return true }
		/** 3-1 | `A  & B <: A  &&  A  & B <: B` */
		if (t.equals(this.left) || t.equals(this.right)) { return true }
		return super.isSubtypeOf(t);
	}
}



/**
 * A type union of two types `T` and `U` is the type
 * that contains values both assignable to `T` *and* assignable to `U`.
 */
class SolidTypeUnion extends SolidType {
	/**
	 * Construct a new SolidTypeUnion object.
	 * @param left the first type
	 * @param right the second type
	 */
	constructor (
		readonly left:  SolidType,
		readonly right: SolidType,
	) {
		super(xjs.Set.union(left.values, right.values))
	}

	override toString(): string {
		return `${ this.left } | ${ this.right }`;
	}
	override includes(v: SolidObject): boolean {
		return this.left.includes(v) || this.right.includes(v)
	}
	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		/** 3-7 | `A <: C    &&  B <: C  <->  A \| B <: C` */
		return this.left.isSubtypeOf(t) && this.right.isSubtypeOf(t)
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
	@SolidType.intersectDeco
	override intersect(t: SolidType): SolidType {
		if (t instanceof SolidTypeInterface) {
			const props: Map<string, SolidType> = new Map([...this.properties]);
			;[...t.properties].forEach(([name, type_]) => {
				props.set(name, (props.has(name)) ? props.get(name)!.intersect(type_) : type_)
			})
			return new SolidTypeInterface(props)
		} else {
			return super.intersect(t);
		};
	}
	/**
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type union is taken.
	 */
	@SolidType.unionDeco
	override union(t: SolidType): SolidType {
		if (t instanceof SolidTypeInterface) {
			const props: Map<string, SolidType> = new Map();
			;[...this.properties].forEach(([name, type_]) => {
				if (t.properties.has(name)) {
					props.set(name, type_.union(t.properties.get(name)!))
				}
			})
			return new SolidTypeInterface(props)
		} else {
			return super.union(t);
		};
	}
	/**
	 * In the general case, `S` is a subtype of `T` if every property of `T` exists in `S`,
	 * and for each of those properties `#prop`, the type of `S#prop` is a subtype of `T#prop`.
	 * In other words, `S` is a subtype of `T` if the set of properties on `T` is a subset of the set of properties on `S`.
	 */
	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
		if (t instanceof SolidTypeInterface) {
			return [...t.properties].every(([name, type_]) =>
				this.properties.has(name) && this.properties.get(name)!.isSubtypeOf(type_)
			)
		} else {
			return super.isSubtypeOf(t);
		};
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
	@strictEqual
	override equals(t: SolidType): boolean {
		return t.isEmpty
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
	override includes(_v: SolidObject): boolean {
		return this.value.equal(_v)
	}
	@strictEqual
	@SolidType.subtypeDeco
	override isSubtypeOf(t: SolidType): boolean {
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
	@strictEqual
	override equals(t: SolidType): boolean {
		return t.isUniverse
	}
}
