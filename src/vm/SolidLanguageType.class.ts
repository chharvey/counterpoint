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
	 * Return whether the given class is a numeric type, i.e., an Integer or a Float.
	 * @return Is this type Number or a subtype?
	 */
	get isNumericType(): boolean {
		return false
	}
}



/**
 * A type intersection of two types.
 * Indicates a value that must have both one and the other type.
 */
export class SolidTypeIntersection extends SolidLanguageType {
	/**
	 * Construct a new SolidTypeIntersection object.
	 * The *intersection* of types `S` and `T` is the *union* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type intersection is taken.
	 * @param operand0 the first type
	 * @param operand1 the second type
	 */
	constructor (
		private readonly operand0: SolidLanguageType,
		private readonly operand1: SolidLanguageType,
	) {
		super(((operand0: SolidLanguageType, operand1: SolidLanguageType) => {
			if (operand0 === operand1) {
				return operand0.properties
			}
			const props: Map<string, SolidLanguageType> = new Map([...operand0.properties])
			;[...operand1.properties].forEach(([name, type_]) => {
				props.set(name, (props.has(name)) ? new SolidTypeIntersection(props.get(name)!, type_) : type_)
			})
			return props
		})(operand0, operand1))
	}
	/** @implements SolidLanguageType */
	get isNumericType(): boolean {
		return this.operand0.isNumericType || this.operand1.isNumericType
	}
}
/**
 * A type union of two types.
 * Indicates a value that could have either one or the other type.
 */
export class SolidTypeUnion extends SolidLanguageType {
	/**
	 * Construct a new SolidTypeIntersection object.
	 * The *union* of types `S` and `T` is the *intersection* of the set of properties on `T` with the set of properties on `S`.
	 * If any properties disagree on type, their type union is taken.
	 * @param operand0 the first type
	 * @param operand1 the second type
	 */
	constructor (
		private readonly operand0: SolidLanguageType,
		private readonly operand1: SolidLanguageType,
	) {
		super(((operand0: SolidLanguageType, operand1: SolidLanguageType) => {
			if (operand0 === operand1) {
				return operand0.properties
			}
			const props: Map<string, SolidLanguageType> = new Map()
			;[...operand0.properties].forEach(([name, type_]) => {
				if (operand1.properties.has(name)) {
					props.set(name, new SolidTypeUnion(type_, operand1.properties.get(name)!))
				}
			})
			return props
		})(operand0, operand1))
	}
	/** @implements SolidLanguageType */
	get isNumericType(): boolean {
		return this.operand0.isNumericType && this.operand1.isNumericType
	}
}
