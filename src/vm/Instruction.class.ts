import SolidLanguageValue, {
	SolidNull,
	SolidBoolean,
} from './SolidLanguageValue.class'
import Float64 from './Float64.class'



// HACK: this is defined here, instead of in `../class/SemanticNode.class`, to avoid circular imports.
export enum Operator {
	NOT,
	EMPTY,
	AFF,
	NEG,
	EXP,
	MUL,
	DIV,
	ADD,
	SUB,
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
	constructor (private readonly value: SolidLanguageValue) {
		super()
	}
	/**
	 * @return `'(i32.const ‹value›)'` or `'(f64.const ‹value›)'`
	 */
	toString(): string {
		return (
			([SolidNull.NULL, SolidBoolean.FALSE].includes(this.value)) ? `(i32.const 0)` :
			(this.value === SolidBoolean.TRUE) ? `(i32.const 1)` :
			`(${ (!this.isFloat) ? 'i32' : 'f64' }.const ${ this.value })`
		)
	}
	get isFloat(): boolean {
		return this.value instanceof Float64
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
		private readonly op: Operator,
		private readonly arg: InstructionExpression,
	) {
		super()
	}
	/**
	 * @return `'(‹op› ‹arg›)'`
	 */
	toString(): string {
		return `(${ new Map<Operator, string>([
			[Operator.NOT,   (!this.isFloat) ? `call $inot ${ this.arg }` : `i32.const 0`],
			[Operator.EMPTY, (!this.isFloat) ? `call $inot ${ this.arg }` : `i32.const 0`],
			[Operator.AFF,   `nop ${ this.arg }`],
			[Operator.NEG,   `${ (!this.isFloat) ? `call $neg` : `f64.neg` } ${ this.arg }`],
		]).get(this.op) || (() => { throw new TypeError('Invalid operation.') })() })`
	}
	get isFloat(): boolean {
		return this.arg.isFloat
	}
}
/**
 * Perform a binary operation on the stack.
 */
export class InstructionBinop extends InstructionExpression {
	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		private readonly op: Operator,
		private readonly arg0: InstructionExpression,
		private readonly arg1: InstructionExpression,
	) {
		super()
		if (this.isFloat && (!this.arg0.isFloat || !this.arg1.isFloat)) {
			throw new TypeError(`Both operands must be either integers or floats, but not a mix.\nOperands: ${ this.arg0 } ${ this.arg1 }`)
		}
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	toString(): string {
		return `(${ new Map<Operator, string>([
			[Operator.ADD, (!this.isFloat) ? `i32.add`   : `f64.add`],
			[Operator.SUB, (!this.isFloat) ? `i32.sub`   : `f64.sub`],
			[Operator.MUL, (!this.isFloat) ? `i32.mul`   : `f64.mul`],
			[Operator.DIV, (!this.isFloat) ? `i32.div_s` : `f64.div`],
			[Operator.EXP, (!this.isFloat) ? `call $exp` : new InstructionUnreachable().toString()], // TODO Runtime exponentiation not yet supported.
		]).get(this.op) || (() => { throw new TypeError('Invalid operation.') })() } ${ this.arg0 } ${ this.arg1 })`
	}
	get isFloat(): boolean {
		return this.arg0.isFloat || this.arg1.isFloat
	}
}
/**
 * Perform a conditional operation on the stack.
 */
export class InstructionCond extends InstructionExpression {
	/**
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 * @param arg2 the third operand
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
	 * @return `'(if (result {i32|f64}) ‹arg0› (then ‹arg1›) (else ‹arg2›))'`
	 */
	toString(): string {
		return `(if (result ${ (!this.isFloat) ? `i32` : `f64` }) ${ this.arg0 } (then ${ this.arg1 }) (else ${ this.arg2 }))`
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
