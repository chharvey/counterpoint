import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	BinValue,
	type Builder,
	type Local,
} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a string template. */
export class Template extends Value {
	public constructor(private readonly items: readonly ValueTac[]) {
		super(OpCode.STR_TEMPLATE, TYPE.STR);
	}

	public override toString(): string {
		return super.toString(...this.items);
	}

	@runOnceMethod
	public override validate(): void {
		return xjs.Array.forEachAggregated(this.items, (item) => item.validate());
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const strings: readonly Local[]                  = this.items.map((item) => cg.newLocal(cg.module.call('stringify', [item.codegen(cg)], cg.reftype.String)));
		const lengths: readonly binaryen.ExpressionRef[] = strings.map((strarr) => cg.module.array.len(strarr.get()));

		const result: Local = cg.newLocal(cg.module.array.new_default(cg.heaptype.String, lengths.reduce((a, b) => cg.module.i32.add(a, b))), cg.reftype.String);
		const offset: Local = cg.newLocal(cg.module.i32.const(0));

		return new BinValue(cg, cg.module.block(null, [
			...strings.map((strarr) => strarr.set()),
			result.set(),
			offset.set(),
			...strings.flatMap((strarr, i) => [
				cg.module.array.copy(
					result.get(),
					offset.get(),
					strarr.get(),
					cg.module.i32.const(0),
					lengths[i],
				),
				offset.set(cg.module.i32.add(offset.get(), lengths[i])),
			]).slice(0, -1), // slice off the last `offset.set`
			result.get(),
		], cg.reftype.String)).value;
	}
}
