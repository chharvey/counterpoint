import * as xjs from 'extrajs';
import type binaryen from 'binaryen';
import {
	drop_then,
	type Builder,
} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/**
 * A Phi function merges branches of control flow in SSA form.
 * @see https://en.wikipedia.org/wiki/Static_single-assignment_form
 */
export class Phi extends Value {
	private readonly labelThen: string;
	private readonly labelElse: string;
	private readonly valueThen: ValueTac;
	private readonly valueElse: ValueTac;

	public constructor(
		[then_label, then_value]: readonly [string, ValueTac],
		[else_label, else_value]: readonly [string, ValueTac],
	) {
		super(OpCode.PHI, then_value.type.union(else_value.type));
		this.labelThen = then_label;
		this.labelElse = else_label;
		this.valueThen = then_value;
		this.valueElse = else_value;
	}

	public override toString(): string {
		return super.toString(
			`"${ this.labelThen }"->${ this.valueThen }`,
			`"${ this.labelElse }"->${ this.valueElse }`,
		);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated([this.valueThen, this.valueElse], (value) => value.validate());
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}

	/* eslint-disable */
	#optimizationStrategy(this: any, cg: Builder, Operator: any, TYPE: any, BinVect: any, t0: any, arg0: any, arg1: any, arg2: any, binaryen: any): number {
		// Binary Logical Operator:
		const block1: binaryen.ExpressionRef = cg.module.block(null, [
			cg.module.drop(arg0),
			arg1,
		], binaryen.v128);
		if (t0.isDefinitelyFalsy) {
			return this.operator === Operator.AND ? arg0 : block1;
		} else if (t0.isDefinitelyTruthy) {
			return this.operator === Operator.AND ? block1 : arg0;
		}


		// Ternary Operator:
		if (t0.isSubtypeOf(TYPE.TRUE)) {
			return drop_then(this.builder.module, [arg0], arg1);
		} else if (t0.isSubtypeOf(TYPE.FALSE)) {
			return drop_then(this.builder.module, [arg0], arg2);
		}

		return cg.module.if(new BinVect(cg.module, arg0).isSpecial(true), arg1, arg2);
	}
	/* eslint-enable */
}
