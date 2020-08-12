import SolidLanguageValue, {
	SolidNull,
	SolidBoolean,
	SolidNumber,
} from '../vm/SolidLanguageValue.class'
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
			(this.value instanceof SolidNull || this.value instanceof SolidBoolean || !to_float)
				? this.value
				: (this.value as SolidNumber<unknown>).toFloat()
		)
	}
}
