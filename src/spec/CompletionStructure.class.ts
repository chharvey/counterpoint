import SolidLanguageValue, {
	SolidNull,
	SolidBoolean,
} from '../vm/SolidLanguageValue.class'
import Int16 from '../vm/Int16.class'
import Instruction, {
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
	build(): Instruction {
		return (
			(this.value instanceof SolidNull)    ? new InstructionConst() :
			(this.value instanceof SolidBoolean) ? new InstructionConst((this.value === SolidBoolean.FALSE) ? 0 : 1) :
			(this.value instanceof Int16)        ? new InstructionConst(Number(this.value.toNumeric())) :
			(() => { throw new Error('not yet supported.') })()
		)
	}
}
