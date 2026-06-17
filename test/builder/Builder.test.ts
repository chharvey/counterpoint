import * as test from 'node:test';
import {
	assertEqualBins,
	genConst,
	setupScript,
} from '../utils.ts';



test.suite('Builder', () => {
	test.test('#codegen', () => {
		const {builder, cg, mod} = setupScript(`{
			val cond:  bool = true;
			val mut x: int  = 1;
			set x = if cond then 3 else 2;
			5 * x;
		}`, {codegen: false});
		return assertEqualBins(builder.codegen(cg), mod.block(null, [
			mod.block('block$4$break', [
				mod.block(null, [
					mod.local.set(0, genConst(cg, true)),
					mod.local.set(1, genConst(cg, 1n)),
					mod.local.set(2, cg.vm.Value.newDefault()),
				]),
				mod.if(
					cg.vm.Value.boolToI32(mod.local.get(0, cg.vm.reftype.Value)),
					mod.block(null, [mod.block(null, [
						mod.local.set(2, genConst(cg, 3n)),
						mod.block(null, [mod.br('block$4$break')]),
					])]),
					mod.block(null, [mod.block(null, [
						mod.local.set(2, genConst(cg, 2n)),
						mod.block(null, [mod.br('block$4$break')]),
					])]),
				),
			]),
			mod.block(null, [mod.block(null, [
				mod.local.set(1, mod.local.get(2, cg.vm.reftype.Value)),
				mod.drop(cg.vm.op.intMul(genConst(cg, 5n), mod.local.get(1, cg.vm.reftype.Value))),
			])]),
		]));
	});
});
