import SolidObject  from '../vm/SolidObject.class'
import SolidNull    from '../vm/SolidNull.class'
import SolidBoolean from '../vm/SolidBoolean.class'
import SolidNumber  from '../vm/SolidNumber.class'
import Int16 from '../vm/Int16.class'
import {
	InstructionConst,
} from '../vm/Instruction.class'



enum CompletionType {
	NORMAL,
	CONTINUE,
	BREAK,
	RETURN,
	THROW,
}



/**
 * An object returned by specification algorithms.
 */
export default class CompletionStructure {
	/** The type of completion that occurred. */
	readonly type: CompletionType;
	/** The value produced by this completion structure. */
	readonly value?: SolidObject;
	/**
	 * Construct a new CompletionStructure object.
	 * @param value The value produced by this completion structure.
	 */
	constructor (value: SolidObject);
	/**
	 * Construct a new CompletionStructure object.
	 * @param type  The type of completion that occurred.
	 * @param value The value produced by this completion structure.
	 */
	constructor (type?: CompletionType, value?: SolidObject);
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
	 * @param to_float Should the value be type-coersed into a floating-point number?
	 * @return the directions to print
	 */
	build(to_float: boolean = false): InstructionConst {
		const value: SolidNumber =
			(this.value instanceof SolidNull)    ? Int16.ZERO :
			(this.value instanceof SolidBoolean) ? (this.value.value) ? Int16.UNIT : Int16.ZERO :
			(this.value instanceof SolidNumber)  ? this.value :
			(() => { throw new Error('not yet supported.') })()
		return new InstructionConst((to_float) ? value.toFloat() : value)
	}
}
