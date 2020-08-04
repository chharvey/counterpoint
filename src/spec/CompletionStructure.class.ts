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
	 * @return the directions to print
	 */
	build(): InstructionConst {
		return (
			(this.value instanceof SolidNull)    ? new InstructionConst(Int16.ZERO) :
			(this.value instanceof SolidBoolean) ? new InstructionConst((this.value === SolidBoolean.FALSE) ? Int16.ZERO : Int16.UNIT) :
			(this.value instanceof SolidNumber)  ? new InstructionConst(this.value) :
			(() => { throw new Error('not yet supported.') })()
		)
	}
}
