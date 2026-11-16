import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../../index.ts';
import {
	TermVisitor,
	type Terminator,
} from '../Terminator.ts';
import type {Goto} from '../Goto.ts';
import type {GotoConditional} from '../GotoConditional.ts';
import {memoizePerCode} from './decorators.ts';
import {ValueVisitorCodegen} from './ValueVisitorCodegen.ts';



/**
 * Generate assembly code.
 *
 * Creates an edge from the Terminator’s containing block to a destination block.
 */
export class TermVisitorCodegen extends TermVisitor<void> {
	readonly #valueVisitorCodegen: ValueVisitorCodegen;


	public constructor(
		private readonly cg:       CodeGenerator,
		private readonly relooper: binaryen.Relooper,
	) {
		super();
		this.#valueVisitorCodegen = new ValueVisitorCodegen(cg);
	}


	@memoizePerCode
	public override visitGoto(term: Goto): void {
		return this.relooper.addBranch(
			this.cg.getBlockRef(term.containerLabel!),
			this.cg.getBlockRef(term.label),
		); // unconditional
	}

	@memoizePerCode
	public override visitGotoConditional(term: GotoConditional): void {
		this.relooper.addBranch(
			this.cg.getBlockRef(term.containerLabel!),
			this.cg.getBlockRef(term.labelIfTrue),
			this.cg.vm.Value.boolToI32(this.#valueVisitorCodegen.visit(term.condition)),
		);
		return this.relooper.addBranch(
			this.cg.getBlockRef(term.containerLabel!),
			this.cg.getBlockRef(term.labelIfFalse),
		); // else (default)
	}

	public override defaultVisit(_term: Terminator): void {
		return;
	}
}
