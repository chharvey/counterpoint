import * as fs from 'fs'
import * as path from 'path'

import Parser from './Parser.class'
import SemanticNode, {
	Operator,
} from './SemanticNode.class'

const i32_neg: string = fs.readFileSync(path.join(__dirname, '../../src/neg.wat'), 'utf8')
const i32_exp: string = fs.readFileSync(path.join(__dirname, '../../src/exp.wat'), 'utf8')



/**
 * The Code Generator.
 */
export default class CodeGenerator {
	/** The output code to produce. */
	private readonly output: string;

	/**
	 * Construct a new CodeGenerator object.
	 * @param source - the entire source text
	 */
	constructor(source: string) {
		this.output = new Parser(source).parse().decorate().compile(this)
	}

	/**
	 * Throw an error at runtime.
	 * @return `'(unreachable)'`
	 */
	unreachable(): string {
		return `(unreachable)`
	}

	/**
	 * Do nothing at runtime.
	 * @return `'(nop)'`
	 */
	nop(): string {
		return `(nop)`
	}

	/**
	 * Push a constant onto the stack.
	 * @param i32 the constant to push
	 * @return `'(i32.const i32)'`
	 */
	const(i32: number): string {
		return `(i32.const ${ i32 })`
	}

	/**
	 * Perform a binary operation on the stack.
	 * @param op the operation to perform
	 * @param arg1 the first operand
	 * @param arg2 the second operand
	 * @return `'(op arg1 arg2)'`
	 */
	binop(op: Operator, arg1: SemanticNode, arg2: SemanticNode): string {
		return `(${ new Map<Operator, string>([
			[Operator.ADD, `i32.add`],
			[Operator.SUB, `i32.sub`],
			[Operator.MUL, `i32.mul`],
			[Operator.DIV, `i32.div_s`],
			[Operator.EXP, `call $exp`],
		]).get(op)! } ${ arg1.compile(this) } ${ arg2.compile(this) })`
	}

	/**
	 * Perform a unary operation on the stack.
	 * @param op the operation to perform
	 * @return `'(op arg)'`
	 */
	unop(op: Operator, arg: SemanticNode): string {
		return `(${ new Map<Operator, string>([
			[Operator.AFF, `nop`],
			[Operator.NEG, `call $neg`],
		]).get(op)! } ${ arg.compile(this) })`
	}

	/**
	 * Return the instructions to print to file.
	 * @return the final output
	 */
	print(): string {
		return `
			(module
				${ i32_neg }
				${ i32_exp }
				(func (export "run") (result i32)
					${ this.output }
				)
			)
		`
	}
}
