import * as xjs from 'extrajs';
import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {drop_then} from './utils-private.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/**
 * A Phi function merges branches of control flow in SSA form.
 * @see https://en.wikipedia.org/wiki/Static_single-assignment_form
 * @deprecated Phi nodes are unused for now but may be used later when we add SSA. SSA will be implemented as an IR optimization later.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Phi extends Value {
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
	public override codegen(_: CodeGenerator): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}

	/* eslint-disable */
	#optimizationStrategy(cg: CodeGenerator, TYPE: any, t0: any, arg0: any, arg1: any, arg2: any): number {
		// Ternary Operator:
		if (t0.isSubtypeOf(TYPE.TRUE)) {
			return drop_then(cg, [arg0], arg1);
		} else if (t0.isSubtypeOf(TYPE.FALSE)) {
			return drop_then(cg, [arg0], arg2);
		}

		return cg.mod.if(cg.vm.Vect.isConst(cg.newVect(arg0), true), arg1, arg2);
	}
	/* eslint-enable */
}
