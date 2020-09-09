import type {
	ValidOperatorUnary,
	ValidOperatorBinary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from '../class/SemanticNode.class'
import type SolidNumber from './SolidNumber.class'
import Float64 from './Float64.class'



// HACK: this is defined here, instead of in `../class/SemanticNode.class`, to avoid circular imports.
export enum Operator {
	NOT,
	EMP,
	AFF,
	NEG,
	EXP,
	MUL,
	DIV,
	ADD,
	SUB,
	LT,
	GT,
	LE,
	GE,
	NLT,
	NGT,
	IS,
	ISNT,
	EQ,
	NEQ,
	AND,
	NAND,
	OR,
	NOR,
	COND,
}



export default abstract class Instruction {
}



/**
 * Absence of instruction.
 */
export class InstructionNone extends Instruction {
	/**
	 * @return `''`
	 */
	toString(): string {
		return ''
	}
}
/**
 * Throw an error at runtime.
 */
class InstructionUnreachable extends Instruction {
	/**
	 * @return `'(unreachable)'`
	 */
	toString(): string {
		return `(unreachable)`
	}
}
/**
 * Do nothing at runtime.
 */
class InstructionNop extends Instruction {
	/**
	 * @return `'(nop)'`
	 */
	toString(): string {
		return `(nop)`
	}
}
/**
 * A superclass abstracting:
 * - InstructionConst
 * - InstructionUnop
 * - InstructionBinop
 */
export abstract class InstructionExpression extends Instruction {
	abstract get isFloat(): boolean;
}
/**
 * Push a constant onto the stack.
 */
export class InstructionConst extends InstructionExpression {
	/**
	 * @param value the constant to push
	 */
	constructor (private readonly value: SolidNumber) {
		super()
	}
	/**
	 * @return `'({i32|f64}.const ‹value›)'`
	 */
	toString(): string {
		return `(${ (!this.isFloat) ? 'i32' : 'f64' }.const ${ (this.value.identical(new Float64(-0.0))) ? '-0.0' : this.value })`
	}
	get isFloat(): boolean {
		return this.value instanceof Float64
	}
}
/**
 * Local variable operations.
 */
abstract class InstructionLocal extends InstructionExpression {
	/**
	 * @param name the variable name (must begin with `'$'`)
	 * @param op an optional expression to manipulate, or a type to declare
	 */
	constructor (
		protected readonly name: string,
		protected readonly op: InstructionExpression | boolean = false,
	) {
		super()
	}
	get isFloat(): boolean {
		return this.op instanceof InstructionExpression ? this.op.isFloat : this.op
	}
}
/**
 * Set a local variable.
 */
export class InstructionSet extends InstructionLocal {
	constructor (name: string, op: InstructionExpression) {
		super(name, op)
	}
	/** @return `'(local.set ‹name› ‹op›)'` */
	toString(): string {
		return `(local.set ${ this.name } ${ this.op })`
	}
}
/**
 * Get a local variable.
 */
export class InstructionGet extends InstructionLocal {
	constructor (name: string, to_float: boolean = false) {
		super(name, to_float)
	}
	/** @return `'(local.get ‹name›)'` */
	toString(): string {
		return `(local.get ${ this.name })`
	}
}
/**
 * Tee a local variable.
 */
export class InstructionTee extends InstructionLocal {
	constructor (name: string, op: InstructionExpression) {
		super(name, op)
	}
	/** @return `'(local.tee ‹name› ‹op›)'` */
	toString(): string {
		return `(local.tee ${ this.name } ${ this.op })`
	}
}
/**
 * Perform a unary operation on the stack.
 */
export class InstructionUnop extends InstructionExpression {
	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg the operand
	 */
	constructor (
		private readonly op: ValidOperatorUnary,
		private readonly arg: InstructionExpression,
	) {
		super()
	}
	/**
	 * @return `'(‹op› ‹arg›)'`
	 */
	toString(): string {
		return `(${ new Map<Operator, string>([
			// [Operator.AFF, `nop`],
			[Operator.NEG, (!this.arg.isFloat) ? `call $neg`  : `f64.neg`],
			[Operator.NOT, (!this.arg.isFloat) ? `call $inot` : `call $fnot`],
			[Operator.EMP, (!this.arg.isFloat) ? `call $iemp` : `call $femp`],
		]).get(this.op)! } ${ this.arg })`
	}
	get isFloat(): boolean {
		return [Operator.AFF, Operator.NEG].includes(this.op) && this.arg.isFloat
	}
}
/**
 * Perform a binary operation on the stack.
 */
export abstract class InstructionBinop extends InstructionExpression {
	protected readonly floatarg: boolean = this.arg0.isFloat || this.arg1.isFloat
	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		protected readonly op:   ValidOperatorBinary,
		protected readonly arg0: InstructionExpression,
		protected readonly arg1: InstructionExpression,
	) {
		super()
		if (this.floatarg && (!this.arg0.isFloat || !this.arg1.isFloat)) {
			throw new TypeError(`Both operands must be either integers or floats, but not a mix.\nOperands: ${ this.arg0 } ${ this.arg1 }`)
		}
	}
}
export class InstructionBinopArithmetic extends InstructionBinop {
	/**
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		op:   ValidOperatorArithmetic,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	toString(): string {
		return `(${ new Map<Operator, string>([
			[Operator.EXP, (!this.floatarg) ? `call $exp` : new InstructionUnreachable().toString()], // TODO Runtime exponentiation not yet supported.
			[Operator.MUL, (!this.floatarg) ? `i32.mul`   : `f64.mul`],
			[Operator.DIV, (!this.floatarg) ? `i32.div_s` : `f64.div`],
			[Operator.ADD, (!this.floatarg) ? `i32.add`   : `f64.add`],
			[Operator.SUB, (!this.floatarg) ? `i32.sub`   : `f64.sub`],
		]).get(this.op)! } ${ this.arg0 } ${ this.arg1 })`
	}
	get isFloat(): boolean {
		return this.floatarg
	}
}
export class InstructionBinopComparative extends InstructionBinop {
	/**
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		op:   ValidOperatorComparative,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	toString(): string {
		return `(${ new Map<Operator, string>([
			[Operator.LT, (!this.floatarg) ? `i32.lt_s` : `f64.lt`],
			[Operator.GT, (!this.floatarg) ? `i32.gt_s` : `f64.gt`],
			[Operator.LE, (!this.floatarg) ? `i32.le_s` : `f64.le`],
			[Operator.GE, (!this.floatarg) ? `i32.ge_s` : `f64.ge`],
		]).get(this.op)! } ${ this.arg0 } ${ this.arg1 })`
	}
	get isFloat(): boolean {
		return false
	}
}
export class InstructionBinopEquality extends InstructionBinop {
	/**
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		op:   ValidOperatorEquality,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	toString(): string {
		return `(${ new Map<Operator, string>([
			[Operator.IS, (!this.floatarg) ? `i32.eq` : `call $fis`],
			[Operator.EQ, (!this.floatarg) ? `i32.eq` : `f64.eq`],
		]).get(this.op)! } ${ this.arg0 } ${ this.arg1 })`
	}
	get isFloat(): boolean {
		return false
	}
}
export class InstructionBinopLogical extends InstructionBinop {
	/**
	 * @param count the index of a temporary optimization variable
	 * @param op an operator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		private readonly count: bigint,
		op:   ValidOperatorLogical,
		arg0: InstructionExpression,
		arg1: InstructionExpression,
	) {
		super(op, arg0, arg1)
	}
	/**
	 * @return a `(select)` instruction determining which operand to produce
	 */
	toString(): string {
		const varname: string = `$o${ this.count }`
		const condition: InstructionExpression = new InstructionUnop(
			Operator.NOT,
			new InstructionUnop(
				Operator.NOT,
				new InstructionGet(varname, this.arg0.isFloat),
			),
		)
		const left:  InstructionExpression = new InstructionTee(varname, this.arg0)
		const right: InstructionExpression = this.arg1
		return `(local ${ varname } ${ (!this.arg0.isFloat) ? `i32` : `f64` }) ${
			(this.op === Operator.AND)
				? new InstructionCond(condition, right, left)
				: new InstructionCond(condition, left, right)
		}`
	}
	get isFloat(): boolean {
		return this.floatarg
	}
}
/**
 * Perform a conditional operation on the stack.
 */
export class InstructionCond extends InstructionExpression {
	/**
	 * @param arg0 the condition
	 * @param arg1 the consequent
	 * @param arg2 the alterantive
	 */
	constructor (
		private readonly arg0: InstructionExpression,
		private readonly arg1: InstructionExpression,
		private readonly arg2: InstructionExpression,
	) {
		super()
		if (this.isFloat && (!this.arg1.isFloat || !this.arg2.isFloat)) {
			throw new TypeError(`Both branches must be either integers or floats, but not a mix.\nOperands: ${ this.arg1 } ${ this.arg2 }`)
		}
	}
	/**
	 * @return `'(select ‹arg1› ‹arg2› ‹arg0›)'`
	 */
	toString(): string {
		return `(select ${ this.arg1 } ${ this.arg2 } ${ this.arg0 })`
	}
	get isFloat(): boolean {
		return this.arg1.isFloat || this.arg2.isFloat
	}
}
/**
 * Create a new operand stack.
 */
export class InstructionStatement extends Instruction {
	/**
	 * @param count the index of the statement within its scope
	 * @param expr the expression
	 */
	constructor (
		private readonly count: bigint,
		private readonly expr: InstructionExpression,
	) {
		super()
	}
	/**
	 * @return a new function evaluating the argument
	 */
	toString(): string {
		return `
			(func (export "f${ this.count }") (result ${ (!this.expr.isFloat) ? `i32` : `f64` })
				${ this.expr }
			)
		`
	}
}
/**
 * Create a program.
 */
export class InstructionModule extends Instruction {
	/**
	 * @param comps the components of the program
	 */
	constructor (private readonly comps: (string | Instruction)[] = []) {
		super()
	}
	/**
	 * @return a new module containing the components
	 */
	toString(): string {
		return `
			(module
				${ this.comps.join('\n') }
			)
		`
	}
}
