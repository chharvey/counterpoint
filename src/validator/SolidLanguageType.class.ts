import type SolidObject  from './SolidObject.class'
import type SolidNull    from './SolidNull.class'
import type SolidBoolean from './SolidBoolean.class'
import type SolidNumber  from './SolidNumber.class'
import type Float64      from './Float64.class'



/**
 * Parent class for all Solid Language Types.
 * Known subclasses:
 * - Intersection
 * - Union
 */
export default class SolidLanguageType {
	/** The Bottom Type, containing no values. */
	static get NEVER(): SolidTypeNever { return SolidTypeNever.INSTANCE }
	/** The Top Type, containing all values. */
	static get UNKNOWN(): SolidTypeUnknown { return SolidTypeUnknown.INSTANCE }


	/**
	 * Whether this type has no values assignable to it,
	 * i.e., it is equal to the Bottom Type (`never`).
	 * Used internally for special cases of computations.
	 */
	readonly isEmpty: boolean = false // this.equals(SolidLanguageType.NEVER)
	/**
	 * Whether this type has all values assignable to it,
	 * i.e., it is equal to the Top Type (`unknown`).
	 * Used internally for special cases of computations.
	 */
	readonly isUniverse: boolean = false // this.equals(SolidLanguageType.UNKNOWN)

	/**
	 * Return whether this type “includes” the value, i.e.,
	 * whether the value is assignable to this type.
	 * @param v the value to check
	 * @returns Is `v` assignable to this type?
	 */
	readonly includes: (v: SolidObject) => boolean;

	/**
	 * Construct a new SolidLanguageType object.
	 * @param values an enumerated set of values that are assignable to this type
	 */
	constructor (values: ReadonlySet<SolidObject>);
	/**
	 * Construct a new SolidType object.
	 * @param includes a predicate to determine if a value is assignable to this type
	 */
	constructor (includes: (v: SolidObject) => boolean);
	constructor (
		arg: ReadonlySet<SolidObject> | ((v: SolidObject) => boolean),
	) {
		this.includes = (arg instanceof Function)
			? arg
			: (v) => arg.has(v)
	}

	/**
	 * Return whether the given class is a boolean type.
	 * @return Is this type Boolean or a subtype?
	 */
	get isBooleanType(): boolean {
		return false
	}
	/**
	 * Return whether the given class is a numeric type, i.e., an Integer or a Float.
	 * @return Is this type Number or a subtype?
	 */
	get isNumericType(): boolean {
		return false
	}
	/**
	 * Return whether the given class is a Float type.
	 * @return Is this type Float or a subtype?
	 */
	get isFloatType(): boolean {
		return false
	}
	/**
	 * Return the type intersection of this type with another.
	 * @param t the other type
	 * @returns the type intersection
	 * @final
	 */
	intersect(t: SolidLanguageType): SolidLanguageType {
		/** 1-5 | `T  & never   == never` */
		if (t.isEmpty) { return SolidLanguageType.NEVER }
		/** 1-6 | `T  & unknown == T` */
		if (t.isUniverse) { return this }

		/** 3-3 | `A <: B  <->  A  & B == A` */
		if (this.isSubtypeOf(t)) { return this }
		if (t.isSubtypeOf(this)) { return t }

		return this.intersect_do(t)
	}
	intersect_do(t: SolidLanguageType): SolidLanguageType { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		return new SolidLanguageType((v) => this.includes(v) && t.includes(v))
	}
	/**
	 * Return the type union of this type with another.
	 * @param t the other type
	 * @returns the type union
	 * @final
	 */
	union(t: SolidLanguageType): SolidLanguageType {
		/** 1-7 | `T \| never   == T` */
		if (t.isEmpty) { return this }
		/** 1-8 | `T \| unknown == unknown` */
		if (t.isUniverse) { return t }

		/** 3-4 | `A <: B  <->  A \| B == B` */
		if (this.isSubtypeOf(t)) { return t }
		if (t.isSubtypeOf(this)) { return this }

		return this.union_do(t)
	}
	union_do(t: SolidLanguageType): SolidLanguageType { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		return new SolidLanguageType((v) => this.includes(v) || t.includes(v))
	}
	/**
	 * Return whether this type is a structural subtype of the given type.
	 * @param t the type to compare
	 * @returns Is this type a subtype of the argument?
	 * @final
	 */
	isSubtypeOf(t: SolidLanguageType): boolean {
		/** 1-3 | `T       <: never  <->  T == never` */
		if (t.isEmpty) { return this.isEmpty }
		/** 1-2 | `T     <: unknown` */
		if (t.isUniverse) { return true }
		/** 2-7 | `A <: A` */
		if (this === t) { return true }

		return this.isSubtypeOf_do(t)
	}
	isSubtypeOf_do(t: SolidLanguageType): boolean { // NOTE: should be protected, but needs to be public because need to implement in SolidObject
		throw 'SolidLanguageType#isSubtypeOf_do not yet supported'
	}
	/**
	 * Return whether this type is structurally equal to the given type.
	 * Two types are structurally equal if they are subtypes of each other.
	 *
	 * 2-8 | `A <: B  &&  B <: A  -->  A == B`
	 * @param t the type to compare
	 * @returns Is this type equal to the argument?
	 * @final
	 */
	equals(t: SolidLanguageType): boolean {
		return this.isSubtypeOf(t) && t.isSubtypeOf(this)
	}
}



/**
 * An Interface Type is a set of properties that a value must have.
 */
export class SolidTypeInterface extends SolidLanguageType {
	/** @override */
	readonly isEmpty: boolean = [...this.properties.values()].some((value) => value.isEmpty)
	/** @override */
	readonly isUniverse: boolean = this.properties.size === 0

	/**
	 * Argument to pass to the `super()` call inside `SolidTypeInterface.constructor`.
	 * We cannot use a lambda because `assert.deepStrictEqual` will not compare functions.
	 */
	private static _constructor_super_arg(this: SolidTypeInterface, v: SolidObject): boolean {
		return [...this.properties.keys()].every((key) => key in v)
	}


	/**
	 * Construct a new SolidLanguageType object.
	 * @param properties a map of this type’s members’ names along with their associated types
	 */
	constructor (readonly properties: ReadonlyMap<string, SolidLanguageType>) {
		// super((v) => [...properties.keys()].every((key) => key in v)) // NOTE: cannot use lambda because `assert.deepStrictEqual` will not compare functions
		super(SolidTypeInterface._constructor_super_arg)
	}

	/**
	 * @override
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type intersection is taken.
	 */
	intersect_do(t: SolidTypeInterface): SolidTypeInterface {
		const props: Map<string, SolidLanguageType> = new Map([...this.properties])
		;[...t.properties].forEach(([name, type_]) => {
			props.set(name, (props.has(name)) ? props.get(name)!.intersect(type_) : type_)
		})
		return new SolidTypeInterface(props)
	}
	/**
	 * @override
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type union is taken.
	 */
	union_do(t: SolidTypeInterface): SolidTypeInterface {
		const props: Map<string, SolidLanguageType> = new Map()
		;[...this.properties].forEach(([name, type_]) => {
			if (t.properties.has(name)) {
				props.set(name, type_.union(t.properties.get(name)!))
			}
		})
		return new SolidTypeInterface(props)
	}
	/**
	 * @override
	 * In the general case, `S` is a subtype of `T` if every property of `T` exists in `S`,
	 * and for each of those properties `#prop`, the type of `S#prop` is a subtype of `T#prop`.
	 * In other words, `S` is a subtype of `T` if the set of properties on `T` is a subset of the set of properties on `S`.
	 */
	isSubtypeOf_do(t: SolidTypeInterface) {
		return [...t.properties].every(([name, type_]) =>
			this.properties.has(name) && this.properties.get(name)!.isSubtypeOf(type_)
		)
	}
}



/**
 * Class for constructing the Bottom Type, the type containing no values.
 */
class SolidTypeNever extends SolidTypeInterface {
	static readonly INSTANCE: SolidTypeNever = new SolidTypeNever()

	/** @override */
	readonly isEmpty: boolean = true
	/** @override */
	readonly isUniverse: boolean = false

	private constructor () {
		super(new Map())
	}

	/** @override */
	get isBooleanType(): boolean { return true }
	/** @override */
	get isNumericType(): boolean { return true }
	/** @override */
	get isFloatType(): boolean { return true }
	/**
	 * @override
	 * 1-5 | `T  & never   == never`
	 */
	intersect(_t: SolidLanguageType): SolidTypeInterface {
		return this
	}
	/**
	 * @override
	 * 1-7 | `T \| never   == T`
	 */
	union(t: SolidTypeInterface): SolidTypeInterface {
		return t
	}
	/**
	 * @override
	 * 1-1 | `never <: T`
	 */
	isSubtypeOf(_t: SolidLanguageType): boolean {
		return true
	}
	/** @override */
	equals(t: SolidLanguageType): boolean {
		return t.isEmpty
	}
}



/**
 * Class for constructing constant types / unit types, types that contain one value.
 */
export class SolidTypeConstant extends SolidTypeInterface {
	/** @override */
	readonly isEmpty: boolean = false
	/** @override */
	readonly isUniverse: boolean = false

	constructor (readonly value: SolidObject) {
		super(((
			SolidObject_class:  typeof SolidObject,
			SolidNull_class:    typeof SolidNull,
			SolidBoolean_class: typeof SolidBoolean,
			SolidNumber_class:  typeof SolidNumber,
		) => (
				(value instanceof SolidNull_class)    ? SolidNull_class.properties :
				(value instanceof SolidBoolean_class) ? SolidBoolean_class.properties :
				(value instanceof SolidNumber_class)  ? SolidNumber_class.properties :
				SolidObject_class.properties
			))(
			require('./SolidObject.class').default,
			require('./SolidNull.class').default,
			require('./SolidBoolean.class').default,
			require('./SolidNumber.class').default,
		))
	}

	get isBooleanType(): boolean {
		const SolidBoolean_class: typeof SolidBoolean = require('./SolidBoolean.class').default
		return this.value instanceof SolidBoolean_class
	}
	get isNumericType(): boolean {
		const SolidNumber_class: typeof SolidNumber = require('./SolidNumber.class').default
		return this.value instanceof SolidNumber_class
	}
	get isFloatType(): boolean {
		const Float64_class: typeof Float64 = require('./Float64.class').default
		return this.value instanceof Float64_class
	}
	isSubtypeOf(t: SolidTypeInterface): boolean {
		return t instanceof Function && this.value instanceof t || super.isSubtypeOf(t)
	}
}



/**
 * Class for constructing the Top Type, the type containing all values.
 */
class SolidTypeUnknown extends SolidTypeInterface {
	static readonly INSTANCE: SolidTypeUnknown = new SolidTypeUnknown()

	/** @override */
	readonly isEmpty: boolean = false
	/** @override */
	readonly isUniverse: boolean = true

	private constructor () {
		super(new Map())
	}

	/** @override */
	get isBooleanType(): boolean { return false }
	/** @override */
	get isNumericType(): boolean { return false }
	/** @override */
	get isFloatType(): boolean { return false }
	/**
	 * @override
	 * 1-6 | `T  & unknown == T`
	 */
	intersect(t: SolidTypeInterface): SolidTypeInterface {
		return t
	}
	/**
	 * @override
	 * 1-8 | `T \| unknown == unknown`
	 */
	union(_t: SolidLanguageType): SolidTypeInterface {
		return this
	}
	/**
	 * @override
	 * 1-4 | `unknown <: T      <->  T == unknown`
	 */
	isSubtypeOf(t: SolidLanguageType): boolean {
		return t.isUniverse
	}
	/** @override */
	equals(t: SolidLanguageType): boolean {
		return t.isUniverse
	}
}
