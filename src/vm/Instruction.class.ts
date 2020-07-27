import {Punctuator} from '../class/Token.class'



export default abstract class Instruction {
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
export class InstructionNop extends Instruction {
	/**
	 * @return `'(nop)'`
	 */
	toString(): string {
		return `(nop)`
	}
}
/**
 * Push a constant onto the stack.
 */
export class InstructionConst extends Instruction {
	/**
	 * @param i32 the constant to push
	 */
	constructor (private readonly i32: number = 0) {
		super()
	}
	/**
	 * @return `'(i32.const ‹i32›)'`
	 */
	toString(): string {
		return `(i32.const ${ this.i32 })`
	}
}
/**
 * Perform a unary operation on the stack.
 */
export class InstructionUnop extends Instruction {
	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg the operand
	 */
	constructor (
		private readonly op: Punctuator,
		private readonly arg: Instruction,
	) {
		super()
	}
	/**
	 * @return `'(op ‹arg›)'`
	 */
	toString(): string {
		return `(${ new Map<Punctuator, string>([
			[Punctuator.AFF, `nop`],
			[Punctuator.NEG, `call $neg`],
		]).get(this.op)! } ${ this.arg })`
	}
}
/**
 * Perform a binary operation on the stack.
 */
export class InstructionBinop extends Instruction {
	/**
	 * @param op a punctuator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 */
	constructor (
		private readonly op: Punctuator,
		private readonly arg0: Instruction,
		private readonly arg1: Instruction,
	) {
		super()
	}
	/**
	 * @return `'(op ‹arg0› ‹arg1›)'`
	 */
	toString(): string {
		return `(${ new Map<Punctuator, string>([
			[Punctuator.ADD, `i32.add`],
			[Punctuator.SUB, `i32.sub`],
			[Punctuator.MUL, `i32.mul`],
			[Punctuator.DIV, `i32.div_s`],
			[Punctuator.EXP, `call $exp`],
		]).get(this.op)! } ${ this.arg0 } ${ this.arg1 })`
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
