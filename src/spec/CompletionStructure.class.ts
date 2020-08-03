import SolidLanguageValue, {
	SolidNull,
	SolidBoolean,
	Float64,
} from '../vm/SolidLanguageValue.class'
import Int16 from '../vm/Int16.class'
import Instruction, {
	InstructionConstInt,
	InstructionConstFloat,
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
	build(): Instruction {
		return (
			(this.value instanceof SolidNull)    ? new InstructionConstInt() :
			(this.value instanceof SolidBoolean) ? new InstructionConstInt((this.value === SolidBoolean.FALSE) ? 0n : 1n) :
			(this.value instanceof Int16)        ? new InstructionConstInt(this.value.toNumeric()) :
			(this.value instanceof Float64)      ? new InstructionConstFloat(this.value.value) :
			(() => { throw new Error('not yet supported.') })()
		)
	}
}
