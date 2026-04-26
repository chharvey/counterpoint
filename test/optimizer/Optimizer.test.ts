import * as test from 'node:test';
import binaryen from 'binaryen';
import {assertEqualBins} from '../assert-helpers.ts';
import {
	setupScript,
	genConst,
} from '../helpers.ts';



test.suite('Optimizer', () => {
	test.test('#codegen', () => {
		const {opt, cg, mod} = setupScript(`{
			val cond:  bool = true;
			val mut x: int  = 1;
			set x = if cond then 3 else 2;
			5 * x;
		}`, {codegen: false});
		return assertEqualBins(opt.codegen(cg), mod.block(null, [
			mod.block('block$4$break', [
				mod.block(null, [
					mod.local.set(0, genConst(cg, true)),
					mod.local.set(1, genConst(cg, 1n)),
					mod.local.set(2, mod.struct.new_default(cg.reftype.Value)),
				]),
				mod.if(
					mod.call('bool-to-i32', [mod.local.get(0, cg.reftype.Value)], binaryen.i32),
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
				mod.local.set(1, mod.local.get(2, cg.reftype.Value)),
				mod.drop(mod.call('vimul', [genConst(cg, 5n), mod.local.get(1, cg.reftype.Value)], cg.reftype.Value)),
			])]),
		]));
	});
});
