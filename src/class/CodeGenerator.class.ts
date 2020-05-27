import * as fs from 'fs'
import * as path from 'path'

import wabt from 'wabt' // need `tsconfig.json#compilerOptions.esModuleInterop = true`

import {
	Punctuator,
} from './Token.class'
import type SemanticNode from './SemanticNode.class'
import Parser from './Parser.class'

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
		this.output = new Parser(source).parse().decorate().evaluate(this)
	}

	/**
	 * Throw an error at runtime.
	 * @return `'(unreachable)'`
	 */
	private unreachable(): string {
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
	 * Perform a unary operation on the stack.
	 * @param op a punctuator representing the operation to perform
	 * @return `'(op arg)'`
	 */
	unop(op: Punctuator, arg: SemanticNode): string {
		return `(${ new Map<Punctuator, string>([
			[Punctuator.AFF, `nop`],
			[Punctuator.NEG, `call $neg`],
		]).get(op)! } ${ arg.evaluate(this) })`
	}

	/**
	 * Perform a binary operation on the stack.
	 * @param op a punctuator representing the operation to perform
	 * @param arg1 the first operand
	 * @param arg2 the second operand
	 * @return `'(op arg1 arg2)'`
	 */
	binop(op: Punctuator, arg1: SemanticNode, arg2: SemanticNode): string {
		return `(${ new Map<Punctuator, string>([
			[Punctuator.ADD, `i32.add`],
			[Punctuator.SUB, `i32.sub`],
			[Punctuator.MUL, `i32.mul`],
			[Punctuator.DIV, `i32.div_s`],
			[Punctuator.EXP, `call $exp`],
		]).get(op)! } ${ arg1.evaluate(this) } ${ arg2.evaluate(this) })`
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
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
	/**
	 * Return a binary format of the program.
	 * @return a binary output in WASM format, which can be executed
	 */
	compile(): Uint8Array {
		const waModule = wabt().parseWat('', this.print(), {})
		waModule.validate()
		return waModule.toBinary({}).buffer
	}
}
