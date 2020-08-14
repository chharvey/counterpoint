import SolidLanguageValue, {
	SolidNull,
	SolidBoolean,
	SolidNumber,
} from '../vm/SolidLanguageValue.class'
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
	/**
	 * Construct a new CompletionStructure object.
	 * @param value The value produced by this completion structure.
	 * @param type  The type of completion that occurred.
	 */
	constructor (
		readonly value: SolidLanguageValue,
		readonly type: CompletionType = CompletionType.NORMAL,
	) {
	}
}



/**
 * The result of a constant fold.
 */
export class CompletionStructureAssessment extends CompletionStructure {
	/**
	 * Construct a new CompletionStructureAssessment object.
	 * @param value The value produced by this completion structure.
	 */
	constructor (value: SolidLanguageValue) {
		super(value)
	}
	/**
	 * Give directions to the runtime code generator.
	 * @param to_float Should the value be type-coersed into a floating-point number?
	 * @return the directions to print
	 */
	build(to_float: boolean = false): InstructionConst {
		return new InstructionConst(
			(this.value instanceof SolidNull)    ? Int16.ZERO :
			(this.value instanceof SolidBoolean) ? (this.value.value) ? Int16.UNIT : Int16.ZERO :
			(this.value instanceof SolidNumber)  ? to_float ? this.value.toFloat() : this.value :
			(() => { throw new Error('not yet supported.') })()
		)
	}
}
