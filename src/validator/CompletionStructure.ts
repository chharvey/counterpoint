import SolidObject  from './SolidObject.class'
import SolidNull    from './SolidNull.class'
import SolidBoolean from './SolidBoolean.class'
import SolidNumber  from './SolidNumber.class'
import {Int16}        from './Int16';
import {
	InstructionConst,
} from '../builder/'



export enum CompletionType {
	NORMAL,
	CONTINUE,
	BREAK,
	RETURN,
	THROW,
}



/**
 * An object returned by specification algorithms.
 */
export class CompletionStructure {
	/** The type of completion that occurred. */
	readonly type: CompletionType;
	/** The value produced by this completion structure. */
	readonly value?: SolidObject;
	/**
	 * Construct a new CompletionStructure object.
	 * A normal completion with no value.
	 */
	constructor ();
	/**
	 * Construct a new CompletionStructure object.
	 * A normal completion with a given value.
	 * @param value The value produced by this completion structure.
	 */
	constructor (value: SolidObject);
	/**
	 * Construct a new CompletionStructure object.
	 * A specified type of completion with no value.
	 * @param type The type of completion that occurred.
	 */
	constructor (type: CompletionType);
	/**
	 * Construct a new CompletionStructure object.
	 * A specified type of completion with a given value.
	 * @param type  The type of completion that occurred.
	 * @param value The value produced by this completion structure.
	 */
	constructor (type: CompletionType, value: SolidObject);
	constructor (arg0: CompletionType | SolidObject = CompletionType.NORMAL, arg1?: SolidObject) {
		;[this.type, this.value] = (arg0 instanceof SolidObject)
			? [CompletionType.NORMAL, arg0]
			: [arg0, arg1]
	}
	get isAbrupt(): boolean {
		return this.type !== CompletionType.NORMAL
	}
}



/**
 * The result of a constant fold.
 */
export class CompletionStructureAssessment extends CompletionStructure {
	/**
	 * Give directions to the runtime code generator.
	 * @param to_float Should the value be type-coerced into a floating-point number?
	 * @return the directions to print
	 */
	build(to_float: boolean = false): InstructionConst {
		if (this.isAbrupt) {
			throw new Error('Cannot build an abrupt completion structure.')
		}
		const value: SolidNumber =
			(this.value instanceof SolidNull)    ? Int16.ZERO :
			(this.value instanceof SolidBoolean) ? (this.value.value) ? Int16.UNIT : Int16.ZERO :
			(this.value instanceof SolidNumber)  ? this.value :
			(() => { throw new Error('not yet supported.') })()
		return new InstructionConst((to_float) ? value.toFloat() : value)
	}
}
