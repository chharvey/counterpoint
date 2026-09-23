import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {runOnceSetter} from '../../lib/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {
	Goto,
	GotoConditional,
	EndProgram,
} from './index.ts';
import {Opcode} from './Opcode.ts';



interface TermVisitorMethods<T> {
	visitGoto            (term: Goto):            T;
	visitGotoConditional (term: GotoConditional): T;
	visitEndProgram      (term: EndProgram):      T;

	defaultVisit(term: Terminator): T;
}
export class TermVisitor<T> {
	public constructor(private readonly methods: Partial<TermVisitorMethods<T>>) {}

	/** @final */
	public visit(term: Terminator): T {
		switch (term.constructor) {
			case Goto:            { return this.methods.visitGoto            ?.(term as Goto)            ?? this.methods.defaultVisit?.(term) ?? assert.fail('Missing implementation.'); }
			case GotoConditional: { return this.methods.visitGotoConditional ?.(term as GotoConditional) ?? this.methods.defaultVisit?.(term) ?? assert.fail('Missing implementation.'); }
			case EndProgram:      { return this.methods.visitEndProgram      ?.(term as EndProgram)      ?? this.methods.defaultVisit?.(term) ?? assert.fail('Missing implementation.'); }
			default:              { return                                                                  this.methods.defaultVisit?.(term) ?? assert.fail('Unexpected subclass.'); }
		}
	}
}



/**
 * A Terminator is the last instruction of a block. It links the block to its destination.
 *
 * Known subclasses:
 * - Goto
 * - GotoConditional
 * - EndProgram
 */
export abstract class Terminator extends Opcode {
	protected _containerLabel?: string;

	@runOnceSetter
	public set containerLabel(label: string) {
		this._containerLabel = label;
	}

	/**
	 * Execute the interpreter.
	 * @param interp an Interpreter
	 */
	public abstract interpret(interp: Interpreter): void;

	/**
	 * Generate assembly code.
	 * Creates an edge from this Terminator’s containing block to a destination block.
	 * @param cg        code-generator
	 * @param relooper  Binaryen Relooper for constructing Binaryen `blocks`
	 */
	public abstract codegen(cg: CodeGenerator, relooper: binaryen.Relooper): void;
}
