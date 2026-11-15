import type * as binaryen from 'binaryen.ts';
import type {
	CodeGenerator,
	Local,
} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a string template. */
export class Template extends Value {
	public constructor(public readonly items: readonly ValueTac[]) {
		super(OpCode.STR_TEMPLATE, TYPE.STR);
	}

	public override toString(): string {
		return super.toString(...this.items);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {heaptype, reftype, Value: VmValue}, mod: {wasm}} = cg;
		const strings: readonly Local[]                  = this.items.map((item) => cg.newLocal(VmValue.asString(item.codegen(cg))));
		const lengths: readonly binaryen.ExpressionRef[] = strings.map((strarr) => wasm.array.len(strarr.get()));

		const result: Local = cg.newLocal(wasm.array.new_default(heaptype.String, lengths.reduce((a, b) => wasm.i32.add(a, b))));
		const offset: Local = cg.newLocal(wasm.i32.const(0));

		return wasm.block(null, [
			...strings.map((strarr) => strarr.set()),
			result.set(),
			offset.set(),
			...strings.flatMap((strarr, i) => [
				wasm.array.copy(
					result.get(),
					offset.get(),
					strarr.get(),
					wasm.i32.const(0),
					lengths[i],
				),
				offset.set(wasm.i32.add(offset.get(), lengths[i])),
			]).slice(0, -1), // slice off the last `offset.set`
			VmValue.fromString(result.get()),
		], reftype.Value);
	}
}
