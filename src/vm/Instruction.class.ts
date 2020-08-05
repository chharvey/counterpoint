import {Punctuator} from '../class/Token.class'
import type {SolidNumber} from './SolidLanguageValue.class'
import Float64 from './Float64.class'



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
	constructor (private readonly value: SolidNumber<unknown>) {
		super()
	}
	/**
	 * @return `'(i32.const ‹value›)'` or `'(f64.const ‹value›)'`
	 */
	toString(): string {
		return `(${ (!this.isFloat) ? 'i32' : 'f64' }.const ${ this.value })`
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
		private readonly op: Punctuator,
		private readonly arg: InstructionExpression,
	) {
		super()
	}
	/**
	 * @return `'(‹op› ‹arg›)'`
	 */
	toString(): string {
		return `(${ new Map<Punctuator, string>([
			[Punctuator.AFF, `nop`],
			[Punctuator.NEG, (!this.isFloat) ? `call $neg` : `f64.neg`],
		]).get(this.op) || (() => { throw new TypeError('Invalid operation.') })() } ${ this.arg })`
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
		private readonly op: Punctuator,
		private readonly arg0: InstructionExpression,
		private readonly arg1: InstructionExpression,
	) {
		super()
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	toString(): string {
		return `(${ new Map<Punctuator, string>([
			[Punctuator.ADD, (!this.isFloat) ? `i32.add`   : `f64.add`],
			[Punctuator.SUB, (!this.isFloat) ? `i32.sub`   : `f64.sub`],
			[Punctuator.MUL, (!this.isFloat) ? `i32.mul`   : `f64.mul`],
			[Punctuator.DIV, (!this.isFloat) ? `i32.div_s` : `f64.div`],
			[Punctuator.EXP, (!this.isFloat) ? `call $exp` : new InstructionUnreachable().toString()], // TODO Runtime exponentiation not yet supported.
		]).get(this.op) || (() => { throw new TypeError('Invalid operation.') })() } ${ this.arg0 } ${ this.arg1 })`
	}
	get isFloat(): boolean {
		return this.arg0.isFloat || this.arg1.isFloat
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
		private readonly expr: Instruction,
	) {
		super()
	}
	/**
	 * @return a new function evaluating the argument
	 */
	toString(): string {
		return `
			(func (export "f${ this.count }") (result i32)
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
