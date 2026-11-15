import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {ValueVisitorCodegen} from './index.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';
import type {Value} from './Value.ts';



/** Conditionally transfer control to the given labels. */
export class GotoConditional extends Terminator {
	/**
	 * Construct a new Goto object.
	 * Represents a conditional jump based on a given boolean condition.
	 * Goto the first label if the condition is true, else to the second label.
	 * @param condition      the condition to evaluate
	 * @param label_if_true  the label to jump to if the condition is true
	 * @param label_if_false the label to jump to if the condition is false
	 */
	public constructor(
		public readonly condition:    Value,
		public readonly labelIfTrue:  string,
		public readonly labelIfFalse: string,
	) {
		super(OpCode.GOTO_IF);
	}

	public override toString(): string {
		return super.toString(this.condition, `"${this.labelIfTrue}"`, `"${this.labelIfFalse}"`);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator, relooper: binaryen.Relooper): void {
		relooper.addBranch(
			cg.getBlockRef(this._containerLabel!),
			cg.getBlockRef(this.labelIfTrue),
			cg.vm.Value.boolToI32(new ValueVisitorCodegen(cg).visit(this.condition)),
		);
		return relooper.addBranch(
			cg.getBlockRef(this._containerLabel!),
			cg.getBlockRef(this.labelIfFalse),
		); // else (default)
	}
}
