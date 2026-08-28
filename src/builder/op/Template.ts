import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {
	CodeGenerator,
	Local,
} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	type VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
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
	public override validate(builder: Builder): void {
		return xjs.Array.forEachAggregated(this.items, (item) => item.validate(builder));
	}

	public override interpret(interp: Interpreter): VALUE.String {
		return this.items.map((value) => value.interpret(interp).toCplString()).reduce((a, b) => a.concatenate(b));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, Value: VmValue}, mod: {wasm}} = cg;
		const strings: readonly Local[]                  = this.items.map((item) => cg.newLocal(VmValue.cast(item.codegen(cg), reftype.String)));
		const lengths: readonly binaryen.ExpressionRef[] = strings.map((strarr) => wasm.array.len(strarr.get()));

		const result: Local = cg.newLocal(wasm.array.new_default(cg.vm.heaptype.String, lengths.reduce((a, b) => wasm.i32.add(a, b))), reftype.String);
		const offset: Local = cg.newLocal(wasm.i32.const(0));

		return VmValue.newComposite(wasm.block(null, [
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
			result.get(),
		], reftype.String));
	}
}
