import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Terminator} from './Terminator.ts';
import type {Value} from './Value.ts';



/** Transfer control to the given label, conditionally if specified. */
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
		private readonly condition:    Value,
		private readonly labelIfTrue:  string,
		private readonly labelIfFalse: string,
	) {
		super(OpCode.GOTO_IF);
	}

	public override toString(): string {
		return super.toString(this.condition, `"${ this.labelIfTrue }"`, `"${ this.labelIfFalse }"`);
	}

	@runOnceMethod
	public override validate(): void {
		this.condition.validate();
		return assert.ok(this.condition.type.isSubtypeOf(TYPE.BOOL));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator, relooper: binaryen.Relooper, blockrefs: ReadonlyMap<string, binaryen.RelooperBlockRef>): void {
		relooper.addBranch(
			blockrefs.get(this._containerLabel!)!,
			blockrefs.get(this.labelIfTrue)!,
			cg.vm.Value.boolToI32(this.condition.codegen(cg)),
			0,
		);
		relooper.addBranch(
			blockrefs.get(this._containerLabel!)!,
			blockrefs.get(this.labelIfFalse)!,
			0, // else (default)
			0,
		);
	}
}
