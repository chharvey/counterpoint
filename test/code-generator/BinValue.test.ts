import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	BinValue,
	bigint_to_i64,
	Builder,
	BinVect,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {genConst} from '../helpers.ts';



test.suite('BinValue', () => {
	/* eslint-disable @typescript-eslint/init-declarations */
	let cg:  Builder;
	let mod: Builder['module'];
	/* eslint-enable @typescript-eslint/init-declarations */
	test.beforeEach(() => {
		cg  = new Builder();
		mod = cg.module;
	});

	test.test('#asComposite', () => {
		xjs.Array.forEachAggregated([
			// `$Value`s with primitive filled
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, bigint_to_i64(mod, 0x100n))),
			new BinValue(cg, new BinVect(mod, bigint_to_i64(mod, 42n))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
			// `$Value`s with composite filled
			new BinValue(cg, cg.codegenTuple()),
			new BinValue(cg, cg.codegenRecord()),
			new BinValue(cg, cg.codegenList()),
			new BinValue(cg, cg.codegenDict()),
		], (binval) => {
			const {asComposite} = binval;
			assertEqualBins(
				asComposite,
				cg.structGet.value.composite(binval.value),
			);
			return assert.strictEqual(binaryen.getExpressionType(asComposite), binaryen.eqref);
		});
	});

	test.test('#toProperty', () => {
		assertEqualBins([
			new BinValue(cg, new BinVect(mod))                              .toProperty(0x100n),
			new BinValue(cg, new BinVect(mod, true).vect)                   .toProperty(0x101n),
			new BinValue(cg, genConst(cg))                                  .toProperty(0x102n),
			new BinValue(cg, genConst(cg, 42n))                             .toProperty(0x103n),
			new BinValue(cg, cg.vm.Value.new(new BinVect(mod, false).vect)) .toProperty(0x104n),
			new BinValue(cg, cg.vm.Value.new(genConst(cg, 4.2)))            .toProperty(0x105n),
			new BinValue(cg, cg.vm.Value.new(genConst(cg, 4.2)))            .toProperty(0x106n),
		], ([
			[0x100n, cg.vm.Value.new(new BinVect(mod).vect)],
			[0x101n, cg.vm.Value.new(new BinVect(mod, true).vect)],
			[0x102n, genConst(cg)],
			[0x103n, genConst(cg, 42n)],
			[0x104n, cg.vm.Value.new(new BinVect(mod, false).vect)],
			[0x105n, cg.vm.Value.new(genConst(cg, 4.2))],
			[0x106n, genConst(cg, 4.2)],
		] as const).map(([id, code]) => cg.module.struct.new([
			bigint_to_i64(cg.module, id, true),
			code,
		], cg.heaptype.Property)));
	});
});
