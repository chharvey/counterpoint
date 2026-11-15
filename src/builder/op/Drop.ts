import type {CodeGenerator} from '../../index.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Evaluate an expression but then drop it. */
export class Drop extends Instruction {
	public constructor(public readonly value: Value) {
		super(OpCode.DROP);
	}

	public override toString(): string {
		return super.toString(this.value);
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: CodeGenerator): number {
		if (!this.expr || !!this.expr.fold()) return cg.mod.wasm.nop();
		return cg.mod.wasm.drop(this.expr!.build());
	}
	/* eslint-enable */
}
