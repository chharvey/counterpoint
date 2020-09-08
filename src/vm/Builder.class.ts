import * as fs from 'fs'
import * as path from 'path'

import wabt from 'wabt' // need `tsconfig.json#compilerOptions.esModuleInterop = true`

import type SolidConfig from '../SolidConfig'
import Validator from '../validator/Validator.class'
import type {
	SemanticStatementType,
} from '../class/SemanticNode.class'
import {
	InstructionModule,
} from './Instruction.class'

const not: string = fs.readFileSync(path.join(__dirname, '../../src/not.wat'), 'utf8')
const emp: string = fs.readFileSync(path.join(__dirname, '../../src/emp.wat'), 'utf8')
const neg: string = fs.readFileSync(path.join(__dirname, '../../src/neg.wat'), 'utf8')
const exp: string = fs.readFileSync(path.join(__dirname, '../../src/exp.wat'), 'utf8')
const fis: string = fs.readFileSync(path.join(__dirname, '../../src/fis.wat'), 'utf8')



/**
 * The Builder generates assembly code.
 */
export default class Builder {
	/** A counter for statements. */
	private stmt_count: bigint = 0n;
	/** The validator. */
	private readonly validator: Validator;

	/**
	 * Construct a new Builder object.
	 * @param source - the entire source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		source: string,
		readonly config: SolidConfig,
	) {
		this.validator = new Validator(source, this.config)
	}

	/**
	 * Return this Builder’s statement count, and then increment it.
	 * @return this Builder’s current statement counter
	 */
	get stmtCount(): bigint {
		return this.stmt_count++
	}

	/**
	 * Return the semantic goal of a program.
	 * @param comps the top-level components
	 * @return an instruction for the list of top-level components
	 */
	goal(comps: readonly SemanticStatementType[]): InstructionModule {
		return new InstructionModule([
			not,
			emp,
			neg,
			exp,
			fis,
			...comps.map((comp) => comp.build(this)),
		])
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	print(): string {
		return this.validator.validate().build(this).toString()
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
