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
	/** The list of stack instructions to perform. */
	private readonly instructions: string[] = []

	/**
	 * Construct a new CodeGenerator object.
	 * @param source - the entire source text
	 */
	constructor(source: string) {
		new Parser(source).parse().decorate().compile(this)
	}

	/**
	 * Throw an error at runtime.
	 * @return this
	 */
	unreachable(): this {
		this.instructions.push(`unreachable`)
		return this
	}

	/**
	 * Do nothing at runtime.
	 * @return this
	 */
	nop(): this {
		this.instructions.push(`nop`)
		return this
	}

	/**
	 * Push a constant onto the stack.
	 * @param i32 the constant to push
	 * @return this
	 */
	const(i32: number): this {
		this.instructions.push(`i32.const ${ i32 }`)
		return this
	}

	/**
	 * Perform a binary operation on the stack.
	 * @param op the operation to perform
	 * @param arg1 the first operand
	 * @param arg2 the second operand
	 * @return this
	 */
	binop(op: Operator, arg1: SemanticNode, arg2: SemanticNode): this {
		arg1.compile(this)
		arg2.compile(this)
		this.instructions.push(new Map<Operator, string>([
			[Operator.ADD, `i32.add`],
			[Operator.SUB, `i32.sub`],
			[Operator.MUL, `i32.mul`],
			[Operator.DIV, `i32.div_s`],
			[Operator.EXP, `call $exp`],
		]).get(op) !)
		return this
	}

	/**
	 * Perform a unary operation on the stack.
	 * @param op the operation to perform
	 * @return this
	 */
	unop(op: Operator, arg: SemanticNode): this {
		arg.compile(this)
		this.instructions.push(new Map<Operator, string>([
			[Operator.AFF, `nop`],
			[Operator.NEG, `call $neg`],
		]).get(op) !)
		return this
	}

	/**
	 * Return the instructions to print to file.
	 */
	print(): string {
		return `
			(module
				${ i32_neg }
				${ i32_exp }
				(func (export "run") (result i32)
					${ this.instructions.join('\n') }
				)
			)
		`
	}
}
