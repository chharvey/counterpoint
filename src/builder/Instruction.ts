import * as xjs from 'extrajs';

import {
	Operator,
	ValidOperatorUnary,
	ValidOperatorBinary,
	ValidOperatorArithmetic,
	ValidOperatorComparative,
	ValidOperatorEquality,
	ValidOperatorLogical,
} from '../enum/Operator.enum'
import {
	SolidNumber,
	Int16,
	Float64,
} from '../validator/'
import {
	SolidObject,
	SolidNull,
	SolidBoolean,
} from '../typer/';



export abstract class Instruction {
}



/**
 * Absence of instruction.
 */
export class InstructionNone extends Instruction {
	/**
	 * @return `''`
	 */
	override toString(): string {
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
	override toString(): string {
		return `(unreachable)`
	}
}
/**
 * Do nothing at runtime.
 */
// @ts-expect-error noUnusedLocals
class InstructionNop extends Instruction {
	/**
	 * @return `'(nop)'`
	 */
	override toString(): string {
		return `(nop)`
	}
}
/**
 * A superclass abstracting:
 * - InstructionConst
 * - InstructionLocal
 * - InstructionUnop
 * - InstructionBinop
 * - InstructionCond
 */
export abstract class InstructionExpression extends Instruction {
	abstract get isFloat(): boolean;
}
/**
 * Push a constant onto the stack.
 */
export class InstructionConst extends InstructionExpression {
	/**
	 * Construct a new InstructionConst given an assessed value.
	 * @param assessed the assessed value
	 * @param to_float Should the value be type-coerced into a floating-point number?
	 * @return the directions to print
	 */
	static fromAssessment(assessed: SolidObject | null, to_float: boolean = false): InstructionConst {
		if (!assessed) {
			throw new Error('Cannot build an abrupt completion structure.')
		}
		const value: SolidNumber =
			(assessed instanceof SolidNull)    ? Int16.ZERO :
			(assessed instanceof SolidBoolean) ? (assessed.value) ? Int16.UNIT : Int16.ZERO :
			(assessed instanceof SolidNumber)  ? assessed :
			(() => { throw new Error('not yet supported.') })()
		return new InstructionConst((to_float) ? value.toFloat() : value)
	}
	/**
	 * @param value the constant to push
	 */
	constructor (private readonly value: SolidNumber) {
		super()
	}
	/**
	 * @return `'({i32|f64}.const ‹value›)'`
	 */
	override toString(): string {
		return `(${ (!this.isFloat) ? 'i32' : 'f64' }.const ${ (this.value.identical(new Float64(-0.0))) ? '-0.0' : this.value })`
	}
	get isFloat(): boolean {
		return this.value instanceof Float64
	}
}
/**
 * Variable operations.
 * - InstructionLocal
 */
abstract class InstructionVariable extends InstructionExpression {
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
 * Global variable operations.
 * - InstructionGlobalGet
 * - InstructionGlobalSet
 */
abstract class InstructionGlobal extends InstructionVariable {
	constructor (name_or_id: bigint | string, op: InstructionExpression | boolean = false) {
		super((typeof name_or_id === 'bigint') ? `$glb${ name_or_id.toString(16) }` : name_or_id, op);
	}
}
/**
 * Get a global variable.
 */
export class InstructionGlobalGet extends InstructionGlobal {
	constructor (name: bigint | string, to_float: boolean = false) {
		super(name, to_float);
	}
	/** @return `'(global.get ‹name›)'` */
	override toString(): string {
		return `(global.get ${ this.name })`;
	}
}
/**
 * Set a global variable.
 */
export class InstructionGlobalSet extends InstructionGlobal {
	constructor (name: bigint | string, op: InstructionExpression) {
		super(name, op);
	}
	/** @return `'(global.set ‹name› ‹op›)'` */
	override toString(): string {
		return `(global.set ${ this.name } ${ this.op })`;
	}
}
/**
 * Local variable operations.
 * - InstructionLocalGet
 * - InstructionLocalSet
 * - InstructionLocalTee
 */
abstract class InstructionLocal extends InstructionVariable {
	constructor (name_or_id: bigint | string, op: InstructionExpression | boolean = false) {
		super((typeof name_or_id === 'bigint') ? `$var${ name_or_id.toString(16) }` : name_or_id, op);
	}
}
/**
 * Get a local variable.
 */
export class InstructionLocalGet extends InstructionLocal {
	constructor (name: bigint | string, to_float: boolean = false) {
		super(name, to_float)
	}
	/** @return `'(local.get ‹name›)'` */
	override toString(): string {
		return `(local.get ${ this.name })`
	}
}
/**
 * Set a local variable.
 */
export class InstructionLocalSet extends InstructionLocal {
	constructor (name: bigint | string, op: InstructionExpression) {
		super(name, op)
	}
	/** @return `'(local.set ‹name› ‹op›)'` */
	override toString(): string {
		return `(local.set ${ this.name } ${ this.op })`
	}
}
/**
 * Tee a local variable.
 */
export class InstructionLocalTee extends InstructionLocal {
	constructor (name: bigint | string, op: InstructionExpression) {
		super(name, op)
	}
	/** @return `'(local.tee ‹name› ‹op›)'` */
	override toString(): string {
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
	override toString(): string {
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
 * - InstructionBinopArithmetic
 * - InstructionBinopComparative
 * - InstructionBinopEquality
 * - InstructionBinopLogical
 */
export abstract class InstructionBinop extends InstructionExpression {
	/** Is either one of the arguments of type `i32`? */
	protected readonly intarg: boolean = !this.arg0.isFloat || !this.arg1.isFloat
	/** Is either one of the arguments of type `f64`? */
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
		if (this.intarg && this.floatarg) {
			throw new TypeError(`Both operands must be either integers or floats, but not a mix.\nOperands: ${ this.arg0 } ${ this.arg1 }`)
		}
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	override toString(): string {
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
		if (this.intarg && this.floatarg) {
			throw new TypeError(`Both operands must be either integers or floats, but not a mix.\nOperands: ${ this.arg0 } ${ this.arg1 }`)
		}
	}
	/**
	 * @return `'(‹op› ‹arg0› ‹arg1›)'`
	 */
	override toString(): string {
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
	override toString(): string {
		return `(${
			(!this.arg0.isFloat && !this.arg1.isFloat) ? `i32.eq` :
			(!this.arg0.isFloat &&  this.arg1.isFloat) ? `call $i_f_is` :
			( this.arg0.isFloat && !this.arg1.isFloat) ? `call $f_i_is` :
			new Map<Operator, string>([
				[Operator.IS, `call $fis`],
				[Operator.EQ, `f64.eq`],
			]).get(this.op)!
		} ${ this.arg0 } ${ this.arg1 })`
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
		if (this.intarg && this.floatarg) {
			throw new TypeError(`Both operands must be either integers or floats, but not a mix.\nOperands: ${ this.arg0 } ${ this.arg1 }`)
		}
	}
	/**
	 * @return a `(select)` instruction determining which operand to produce
	 */
	override toString(): string {
		const varname: string = `$o${ this.count.toString(16) }`;
		const condition: InstructionExpression = new InstructionUnop(
			Operator.NOT,
			new InstructionUnop(
				Operator.NOT,
				new InstructionLocalTee(varname, this.arg0),
			),
		)
		const left:  InstructionExpression = new InstructionLocalGet(varname, this.arg0.isFloat)
		const right: InstructionExpression = this.arg1
		return `${ new InstructionDeclareLocal(varname, this.arg0.isFloat) } ${
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
		if ((this.arg1.isFloat || this.arg2.isFloat) && (!this.arg1.isFloat || !this.arg2.isFloat)) {
			throw new TypeError(`Both branches must be either integers or floats, but not a mix.\nOperands: ${ this.arg1 } ${ this.arg2 }`)
		}
	}
	/**
	 * @return `'(if (result {i32|f64}) ‹arg0› (then ‹arg1›) (else ‹arg2›))'`
	 */
	override toString(): string {
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
	override toString(): string {
		const result: string = (this.expr instanceof InstructionGlobalSet)
			? ''
			: `(result ${ (this.expr.isFloat) ? 'f64' : 'i32' })`
		;
		return xjs.String.dedent`
			(func (export "f${ this.count }") ${ result }
				${ this.expr }
			)
		`
	}
}
/**
 * Declare a global variable.
 */
export class InstructionDeclareGlobal extends Instruction {
	private readonly type: string = (this.init.isFloat) ? 'f64' : 'i32';
	/**
	 * @param name the variable name (must begin with `'$'`)
	 * @param mut  is the variable mutable? (may it be reassigned?)
	 * @param init the initial value of the variable
	 */
	constructor (
		private readonly name: bigint | string,
		private readonly mut: boolean,
		private readonly init: InstructionExpression,
	) {
		super();
		this.name = (typeof name === 'bigint') ? `$glb${ name.toString(16) }` : name;
	}
	/** @return `'(global ‹name› ‹type› ‹init›)'` */
	override toString(): string {
		return `(global ${ this.name } ${ (this.mut) ? `(mut ${ this.type })` : this.type } ${ this.init })`;
	}
}
/**
 * Declare a local variable.
 */
export class InstructionDeclareLocal extends Instruction {
	/**
	 * @param name the variable name (must begin with `'$'`)
	 * @param to_float `true` if declaring a float
	 */
	constructor (
		private readonly name: string,
		private readonly to_float: boolean,
	) {
		super();
	}
	/** @return `'(local ‹name› ‹type›)'` */
	override toString(): string {
		return `(local ${ this.name } ${ (this.to_float) ? 'f64' : 'i32' })`;
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
	override toString(): string {
		return xjs.String.dedent`
			(module
				${ this.comps.join('\n') }
			)
		`
	}
}
