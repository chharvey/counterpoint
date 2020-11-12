import * as fs from 'fs'
import * as path from 'path'

import wabt from 'wabt' // need `tsconfig.json#compilerOptions.esModuleInterop = true`

import SolidConfig, {CONFIG_DEFAULT} from '../SolidConfig';
import {
	Validator,
	SemanticNodeGoal,
} from '../validator/'



/**
 * The Builder generates assembly code.
 */
export default class Builder {
	static readonly IMPORTS: readonly string[] = [
		fs.readFileSync(path.join(__dirname, '../../src/builder/not.wat'), 'utf8'),
		fs.readFileSync(path.join(__dirname, '../../src/builder/emp.wat'), 'utf8'),
		fs.readFileSync(path.join(__dirname, '../../src/builder/neg.wat'), 'utf8'),
		fs.readFileSync(path.join(__dirname, '../../src/builder/exp.wat'), 'utf8'),
		fs.readFileSync(path.join(__dirname, '../../src/builder/fis.wat'), 'utf8'),
	]


	/** A semantic goal produced by a Validator. */
	private readonly semanticgoal: SemanticNodeGoal;
	/** A counter for internal variables. Used for optimizing short-circuited expressions. */
	private var_count: bigint = 0n
	/** A counter for statements. */
	private stmt_count: bigint = 0n;

	/**
	 * Construct a new Builder object.
	 * @param source - the source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (
		source: string,
		readonly config: SolidConfig = CONFIG_DEFAULT,
	) {
		this.semanticgoal = new Validator(source, config).validate();
	}

	/**
	 * Return this Builder’s short-circuit variable count, and then increment it.
	 * @return this Builder’s current variable counter
	 */
	get varCount(): bigint {
		return this.var_count++
	}

	/**
	 * Return this Builder’s statement count, and then increment it.
	 * Also resets the short-circuit variable count.
	 * @return this Builder’s current statement counter
	 */
	get stmtCount(): bigint {
		this.var_count = 0n
		return this.stmt_count++
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	print(): string {
		return this.semanticgoal.build(this).toString()
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
