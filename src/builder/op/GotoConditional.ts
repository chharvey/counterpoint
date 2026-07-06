import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
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
	public override validate(builder: Builder): void {
		this.condition.validate(builder);
		return assert.ok(this.condition.type.isSubtypeOf(TYPE.BOOL));
	}

	public override interpret(interp: Interpreter): void {
		const condition: VALUE.Value = this.condition.interpret(interp);
		return interp.interpretNextBlock((
			condition.equal(VALUE.TRUE)  ? this.labelIfTrue :
			condition.equal(VALUE.FALSE) ? this.labelIfFalse :
			assert.fail(new TypeError('Expected condition of a `GotoConditional` to be of type `Boolean`.'))
		));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator, relooper: binaryen.Relooper): void {
		relooper.addBranch(
			cg.getBlockRef(this._containerLabel!),
			cg.getBlockRef(this.labelIfTrue),
			cg.vm.Value.boolToI32(this.condition.codegen(cg)),
			0,
		);
		return relooper.addBranch(
			cg.getBlockRef(this._containerLabel!),
			cg.getBlockRef(this.labelIfFalse),
			0, // else (default)
			0,
		);
	}
}
