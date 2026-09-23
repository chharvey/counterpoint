import * as test from 'node:test';
import {
	assertEqualBins,
	genConst,
	setupScript,
} from '../utils.ts';



test.suite('Builder', () => {
	test.test('#codegen', () => {
		const {builder, cg, wasm} = setupScript(`{
			val cond:  bool = true;
			val mut x: int  = 1;
			set x = if cond then 3 else 2;
			5 * x;
		}`, {codegen: false});
		return assertEqualBins(builder.codegen(cg), wasm.block(null, [
			wasm.block('block$4$break', [
				wasm.block(null, [
					wasm.local.set(0, genConst(cg, true)),
					wasm.local.set(1, genConst(cg, 1n)),
					wasm.local.set(2, cg.vm.Value.newDefault()),
				]),
				wasm.if(
					cg.vm.Value.boolToI32(wasm.local.get(0, cg.vm.reftype.Value)),
					wasm.block(null, [wasm.block(null, [
						wasm.local.set(2, genConst(cg, 3n)),
						wasm.block(null, [wasm.br('block$4$break')]),
					])]),
					wasm.block(null, [wasm.block(null, [
						wasm.local.set(2, genConst(cg, 2n)),
						wasm.block(null, [wasm.br('block$4$break')]),
					])]),
				),
			]),
			wasm.block(null, [wasm.block(null, [
				wasm.local.set(1, wasm.local.get(2, cg.vm.reftype.Value)),
				wasm.drop(cg.vm.op.intMul(genConst(cg, 5n), wasm.local.get(1, cg.vm.reftype.Value))),
			])]),
		]));
	});
});
