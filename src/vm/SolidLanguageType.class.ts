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
		if (this === t) {
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
		if (this === t) {
			return this
		}
		const props: Map<string, SolidLanguageType> = new Map()
		;[...this.properties].forEach(([name, type_]) => {
			if (t.properties.has(name)) {
				props.set(name, type_.union(t.properties.get(name)!))
			}
		})
		return new SolidLanguageType(props)
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
