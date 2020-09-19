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
	readonly isEmpty: boolean = [...this.properties.values()].some((value) => value.isEmpty)
	/**
	 * Whether this type has all values assignable to it,
	 * i.e., it is equal to the Top Type (`unknown`).
	 * Used internally for special cases of computations.
	 */
	readonly isUniverse: boolean = this.properties.size === 0

	/**
	 * Construct a new SolidLanguageType object.
	 * @param properties a map of this type’s members’ names along with their associated types
	 */
	constructor (readonly properties: ReadonlyMap<string, SolidLanguageType>) {
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
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type intersection is taken.
	 * @param t the other type
	 * @returns the type intersection
	 */
	intersect(t: SolidLanguageType): SolidLanguageType {
		/** 3  | `T  & never   == never` */
		if (t.isEmpty) { return SolidLanguageType.NEVER }
		if (
			/** 4  | `T  & unknown == T` */
			t.isUniverse ||
			/** 18 | `A <: B  <->  A  & B == A` */
			this.isSubtypeOf(t)
		) {
			return this
		}

		const props: Map<string, SolidLanguageType> = new Map([...this.properties])
		;[...t.properties].forEach(([name, type_]) => {
			props.set(name, (props.has(name)) ? props.get(name)!.intersect(type_) : type_)
		})
		return new SolidLanguageType(props)
	}
	/**
	 * Return the type union of this type with another.
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type union is taken.
	 * @param t the other type
	 * @returns the type union
	 */
	union(t: SolidLanguageType): SolidLanguageType {
		/** 5  | `T \| never   == T` */
		if (t.isEmpty) { return this }
		if (
			/** 6  | `T \| unknown == unknown` */
			t.isUniverse ||
			/** 19 | `A <: B  <->  A \| B == B` */
			this.isSubtypeOf(t)
		) {
			return t
		}

		const props: Map<string, SolidLanguageType> = new Map()
		;[...this.properties].forEach(([name, type_]) => {
			if (t.properties.has(name)) {
				props.set(name, type_.union(t.properties.get(name)!))
			}
		})
		return new SolidLanguageType(props)
	}
	/**
	 * Return whether this type is a structural subtype of the given type.
	 * In the general case, `S` is a subtype of `T` if every property of `T` exists in `S`,
	 * and for each of those properties `#prop`, the type of `S#prop` is a subtype of `T#prop`.
	 * In other words, `S` is a subtype of `T` if the set of properties on `T` is a subset of the set of properties on `S`.
	 * @param t the type to compare
	 * @returns Is this type a subtype of the argument?
	 */
	isSubtypeOf(t: SolidLanguageType): boolean {
		/** `T <: never  <->  T == never` (not in docs, but follows from 18, 3, 13) */
		if (t.isEmpty) { return this.isEmpty }
		/** 2  | `T     <: unknown` */
		if (t.isUniverse) { return true }

		return this === t || [...t.properties].every(([name, type_]) =>
			this.properties.has(name) && this.properties.get(name)!.isSubtypeOf(type_)
		)
	}
	/**
	 * Return whether this type is structurally equal to the given type.
	 * Two types are structurally equal if they are subtypes of each other.
	 * @param t the type to compare
	 * @returns Is this type equal to the argument?
	 */
	equals(t: SolidLanguageType): boolean {
		return this.isSubtypeOf(t) && t.isSubtypeOf(this)
	}
}



/**
 * Class for constructing the Bottom Type, the type containing no values.
 */
class SolidTypeNever extends SolidLanguageType {
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
	 * 3  | `T  & never   == never`
	 */
	intersect(_t: SolidLanguageType): SolidLanguageType {
		return this
	}
	/**
	 * @override
	 * 5  | `T \| never   == T`
	 */
	union(t: SolidLanguageType): SolidLanguageType {
		return t
	}
	/**
	 * @override
	 * 1  | `never <: T`
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
export class SolidTypeConstant extends SolidLanguageType {
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
	isSubtypeOf(t: SolidLanguageType): boolean {
		return t instanceof Function && this.value instanceof t || super.isSubtypeOf(t)
	}
}



/**
 * Class for constructing the Top Type, the type containing all values.
 */
class SolidTypeUnknown extends SolidLanguageType {
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
	 * 4  | `T  & unknown == T`
	 */
	intersect(t: SolidLanguageType): SolidLanguageType {
		return t
	}
	/**
	 * @override
	 * 6  | `T \| unknown == unknown`
	 */
	union(_t: SolidLanguageType): SolidLanguageType {
		return this
	}
	/**
	 * @override
	 * `unknown <: T  <->  T == unknown` (not in docs, but follows from 19, 4, 13)
	 */
	isSubtypeOf(t: SolidLanguageType): boolean {
		return t.isUniverse
	}
	/** @override */
	equals(t: SolidLanguageType): boolean {
		return t.isUniverse
	}
}
