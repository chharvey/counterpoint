import {runOnceSetter} from '../../lib/index.ts';
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
			case EndProgram:      { return this.visitEndProgram      (term as EndProgram); } // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion

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
	#containerLabel?: string;

	/** @final */
	public get containerLabel(): string | undefined {
		return this.#containerLabel;
	}

	/** @final */
	@runOnceSetter
	public set containerLabel(label: string) {
		this.#containerLabel = label;
	}
}
