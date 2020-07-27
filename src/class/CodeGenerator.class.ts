import * as fs from 'fs'
import * as path from 'path'

import wabt from 'wabt' // need `tsconfig.json#compilerOptions.esModuleInterop = true`

import type SolidConfig from '../SolidConfig'

import {
	Punctuator,
} from './Token.class'
import type {
	Assessment,
	SemanticStatementType,
} from './SemanticNode.class'
import Parser from './Parser.class'

const i32_neg: string = fs.readFileSync(path.join(__dirname, '../../src/neg.wat'), 'utf8')
const i32_exp: string = fs.readFileSync(path.join(__dirname, '../../src/exp.wat'), 'utf8')



/**
 * The Code Generator.
 */
export default class CodeGenerator {
	/**
	 * Throw an error at runtime.
	 * @return `'(unreachable)'`
	 */
	private static unreachable(): string {
		return `(unreachable)`
	}
	/**
	 * Do nothing at runtime.
	 * @return `'(nop)'`
	 */
	static nop(): string {
		return `(nop)`
	}
	/**
	 * Push a constant onto the stack.
	 * @param i32 the constant to push
	 * @return `'(i32.const i32)'`
	 */
	static const(i32: number): string {
		return `(i32.const ${ i32 })`
	}
	/**
	 * Perform a unary operation on the stack.
	 * @param op a punctuator representing the operation to perform
	 * @param arg the operand
	 * @return `'(op arg)'`
	 */
	static unop(op: Punctuator, arg: string): string {
		return `(${ new Map<Punctuator, string>([
			[Punctuator.AFF, `nop`],
			[Punctuator.NEG, `call $neg`],
		]).get(op)! } ${ arg })`
	}
	/**
	 * Perform a binary operation on the stack.
	 * @param op a punctuator representing the operation to perform
	 * @param arg0 the first operand
	 * @param arg1 the second operand
	 * @return `'(op arg0 arg1)'`
	 */
	static binop(op: Punctuator, arg0: string, arg1: string): string {
		return `(${ new Map<Punctuator, string>([
			[Punctuator.ADD, `i32.add`],
			[Punctuator.SUB, `i32.sub`],
			[Punctuator.MUL, `i32.mul`],
			[Punctuator.DIV, `i32.div_s`],
			[Punctuator.EXP, `call $exp`],
		]).get(op)! } ${ arg0 } ${ arg1 })`
	}
	/**
	 * Create a new operand stack.
	 * @param expr the expression
	 * @return a new function evaluating the argument
	 */
	static stmt(count: bigint, expr: string): string {
		return `
			(func (export "f${ count }") (result i32)
				${ expr }
			)
		`
	}
	/**
	 * Create a program.
	 * @param comps the components of the program
	 * @return a new module containing the components
	 */
	static mod(...comps: string[]): string {
		return `
			(module
				${ comps.join('\n') }
			)
		`
	}


	/** A counter for statements. */
	private stmt_count: bigint = 0n;
	/** The output code to produce. */
	private readonly output: string;

	/**
	 * Construct a new CodeGenerator object.
	 * @param source - the entire source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (source: string, config: SolidConfig) {
		this.output = new Parser(source, config).parse().decorate().build(this)
	}

	/**
	 * Return a new statement-expression.
	 * @param expr the assessment of an expression
	 * @return a call to {@link CodeGenerator.stmt}
	 */
	stmt(expr: Assessment): string {
		return CodeGenerator.stmt(this.stmt_count++, expr.build(this))
	}

	/**
	 * Return the semantic goal of a program.
	 * @return the list of top-level components
	 */
	goal(comps: readonly SemanticStatementType[]): string {
		return comps.map((comp) => comp.build(this)).join('\n')
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	print(): string {
		return CodeGenerator.mod(i32_neg, i32_exp, this.output)
	}

	/**
	 * Return a binary format of the program.
	 * @return a binary output in WASM format, which can be executed
	 */
	async compile(): Promise<Uint8Array> {
		const waModule = (await wabt()).parseWat('', this.print(), {})
		waModule.validate()
		return waModule.toBinary({}).buffer
	}
}
