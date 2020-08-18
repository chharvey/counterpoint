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
	/** The type of completion that occurred. */
	readonly type: CompletionType;
	/** The value produced by this completion structure. */
	readonly value?: SolidLanguageValue;
	/**
	 * Construct a new CompletionStructure object.
	 * @param value The value produced by this completion structure.
	 */
	constructor (value: SolidLanguageValue);
	/**
	 * Construct a new CompletionStructure object.
	 * @param type  The type of completion that occurred.
	 * @param value The value produced by this completion structure.
	 */
	constructor (type?: CompletionType, value?: SolidLanguageValue);
	constructor (arg0: CompletionType | SolidLanguageValue = CompletionType.NORMAL, arg1?: SolidLanguageValue) {
		;[this.type, this.value] = (arg0 instanceof SolidLanguageValue)
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
		const value: SolidNumber<unknown> =
			(this.value instanceof SolidNull)    ? Int16.ZERO :
			(this.value instanceof SolidBoolean) ? (this.value.value) ? Int16.UNIT : Int16.ZERO :
			(this.value instanceof SolidNumber)  ? this.value :
			(() => { throw new Error('not yet supported.') })()
		return new InstructionConst((to_float) ? value.toFloat() : value)
	}
}
