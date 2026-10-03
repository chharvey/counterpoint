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



export abstract class TermVisitor<T> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public visitGoto            (term: Goto):            T { return this.defaultVisit(term); }
	public visitGotoConditional (term: GotoConditional): T { return this.defaultVisit(term); }
	public visitEndProgram      (term: EndProgram):      T { return this.defaultVisit(term); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public abstract defaultVisit(term: Terminator): T;

	/** @final */
	public visit(term: Terminator): T {
		switch (term.constructor) {
			case Goto:            { return this.visitGoto            (term as Goto); }
			case GotoConditional: { return this.visitGotoConditional (term as GotoConditional); }
			case EndProgram:      { return this.visitEndProgram      (term as EndProgram); }

			default: { return this.defaultVisit(term); }
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
