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
	/**
	 * The Bottom Type, containing no values.
	 * Not subclassable or instantiable, thus not a class.
	 */
	static readonly NEVER: SolidLanguageType = {
		/** @implements SolidLanguageType */
		get properties(): ReadonlyMap<string, SolidLanguageType> {
			return new Map([
				['_', SolidLanguageType.NEVER],
			])
		},
		/** @implements SolidLanguageType */
		isEmpty: true,
		/** @implements SolidLanguageType */
		isBooleanType: true,
		/** @implements SolidLanguageType */
		isNumericType: true,
		/** @implements SolidLanguageType */
		isFloatType: true,
		/**
		 * @implements SolidLanguageType
		 * 3  | `T  & never   == never`
		 */
		intersect(_t: SolidLanguageType): SolidLanguageType {
			return this
		},
		/**
		 * @implements SolidLanguageType
		 * 5  | `T \| never   == T`
		 */
		union(t: SolidLanguageType): SolidLanguageType {
			return t
		},
		/**
		 * @implements SolidLanguageType
		 * 1  | `never <: T`
		 */
		isSubtypeOf(_t: SolidLanguageType): boolean {
			return true
		},
		/** @implements SolidLanguageType */
		equals(t: SolidLanguageType): boolean {
			return t.isEmpty
		},
	}
	/**
	 * Construct a new SolidLanguageType object.
	 * @param properties a map of this type’s members’ names along with their associated types
	 */
	constructor (readonly properties: ReadonlyMap<string, SolidLanguageType>) {
	}
	/**
	 * Return whether this type has no values assignable to it,
	 * i.e., it is equal to the Bottom Type (`never`).
	 * Used for special cases of {@link isSubTypeOf} and {@link equals}.
	 * @returns Is this type equal to `never`?
	 */
	get isEmpty(): boolean {
		return [...this.properties.values()].some((value) => value.isEmpty)
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
		/** 18 | `A <: B  <->  A  & B == A` */
		if (this.isSubtypeOf(t)) { return this }

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
		/** 19 | `A <: B  <->  A \| B == B` */
		if (this.isSubtypeOf(t)) { return t }

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
		/** `T <: never  -->  T == never` (not in docs, but follows from 3 and 18) */
		if (t.isEmpty) { return this.isEmpty }

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



export class SolidTypeConstant extends SolidLanguageType {
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
}
