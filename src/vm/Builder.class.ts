import * as fs from 'fs'
import * as path from 'path'

import wabt from 'wabt' // need `tsconfig.json#compilerOptions.esModuleInterop = true`

import type SolidConfig from '../SolidConfig'
import type {
	SemanticNodeExpression,
	SemanticStatementType,
	SemanticNodeGoal,
} from '../class/SemanticNode.class'
import Parser from '../class/Parser.class'
import type {
	CompletionStructureAssessment,
} from '../spec/CompletionStructure.class'
import {
	InstructionStatement,
	InstructionModule,
} from './Instruction.class'

const i32_neg: string = fs.readFileSync(path.join(__dirname, '../../src/neg.wat'), 'utf8')
const i32_exp: string = fs.readFileSync(path.join(__dirname, '../../src/exp.wat'), 'utf8')



/**
 * The Builder generates assembly code.
 */
export default class Builder {
	/** A counter for statements. */
	private stmt_count: bigint = 0n;
	/** The goal symbol of the program. */
	private readonly _goal: SemanticNodeGoal;

	/**
	 * Construct a new Builder object.
	 * @param source - the entire source text
	 * @param config - The configuration settings for an instance program.
	 */
	constructor (source: string, config: SolidConfig) {
		this._goal = new Parser(source, config).parse().decorate()
	}

	/**
	 * Return a new statement-expression.
	 * @param expr a semantic expression
	 * @return a call to {@link CodeGenerator.stmt}
	 */
	stmt(expr: SemanticNodeExpression): InstructionStatement {
		const assess: CompletionStructureAssessment | null = expr.assess()
		return new InstructionStatement(this.stmt_count++, (assess) ? assess.build() : expr.build(this))
	}

	/**
	 * Return the semantic goal of a program.
	 * @param comps the top-level components
	 * @return an instruction for the list of top-level components
	 */
	goal(comps: readonly SemanticStatementType[]): InstructionModule {
		return new InstructionModule([
			i32_neg,
			i32_exp,
			...comps.map((comp) => comp.build(this)),
		])
	}

	/**
	 * Return the instructions to print to file.
	 * @return a readable text output in WAT format, to be compiled into WASM
	 */
	print(): string {
		return this._goal.build(this).toString();
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
