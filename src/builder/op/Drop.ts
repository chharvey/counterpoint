import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {Builder} from '../Builder.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Evaluate an expression but then drop it. */
export class Drop extends Instruction {
	public constructor(private readonly value: Value) {
		super(OpCode.DROP);
	}

	public override toString(): string {
		return super.toString(this.value);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		return this.value.validate(builder);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.mod.drop(this.value.codegen(cg));
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: CodeGenerator): number {
		if (!this.expr || !!this.expr.fold()) return cg.vm.mod.nop();
		return cg.vm.mod.drop(this.expr!.build());
	}
	/* eslint-enable */
}
