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
import {repeat} from '../utils.ts';



test.suite('BinValue', () => {
	/* eslint-disable @typescript-eslint/init-declarations */
	let cg:  Builder;
	let mod: Builder['module'];
	/* eslint-enable @typescript-eslint/init-declarations */
	test.beforeEach(() => {
		cg  = new Builder();
		mod = cg.module;
	});

	test.suite('#value', () => {
		test.test('primitive values.', () => {
			xjs.Array.forEachAggregated([
				new BinVect(mod, null),
				new BinVect(mod, false),
				new BinVect(mod, bigint_to_i64(mod, 0x100n)),
				new BinVect(mod, bigint_to_i64(mod, 42n)),
				new BinVect(mod, mod.f64.const(4.2)),
			], (binvect) => assertEqualBins(new BinValue(cg, binvect).value, mod.struct.new([
				mod.i32.const(1),
				binvect.vect,
				mod.ref.null(binaryen.eqref),
			], cg.heaptype.Value)));
		});
		test.test('composite values.', () => {
			xjs.Array.forEachAggregated([
				cg.codegenTuple([
					genConst(cg, true),
					genConst(cg, 42n),
				]),
				cg.codegenRecord(new Map([
					[0x100n, new BinValue(cg, genConst(cg, true)).toProperty(0x100n)],
					[0x101n, new BinValue(cg, genConst(cg, 42n)) .toProperty(0x101n)],
					[0x102n, new BinValue(cg, genConst(cg, 4.2)) .toProperty(0x102n)],
				])),
				cg.codegenList([
					genConst(cg, 1.1),
					genConst(cg, 2.2),
					genConst(cg, 3.3),
					...repeat(cg.module.ref.null(cg.reftypeNull.Value), 5),
				]),
				cg.codegenDict(new Map([
					[0x106n, new BinValue(cg, genConst(cg, 1.1)).toProperty(0x106n)],
					[0x107n, new BinValue(cg, genConst(cg, 2.2)).toProperty(0x107n)],
					[0x108n, new BinValue(cg, genConst(cg, 3.3)).toProperty(0x108n)],
					[0x109n, new BinValue(cg, genConst(cg, 4.4)).toProperty(0x109n)],
					[0x10an, new BinValue(cg, genConst(cg, 5.5)).toProperty(0x10an)],
				])),
			], (composite) => assertEqualBins(new BinValue(cg, composite).value, mod.struct.new([
				mod.i32.const(2),
				mod.v128.const(new Uint8Array(16)),
				composite,
			], cg.heaptype.Value)));
		});
		test.test('reuses `BinValue#value`.', () => {
			assertEqualBins(
				new BinValue(cg, genConst(cg, 42n)).value,
				genConst(cg, 42n),
			);
		});
	});

	test.test('#isPrimitive', () => {
		xjs.Array.forEachAggregated([
			new BinValue(cg, null),
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, bigint_to_i64(mod, 0x100n))),
			new BinValue(cg, new BinVect(mod, bigint_to_i64(mod, 42n))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
		], (binval) => assertEqualBins(
			binval.isPrimitive,
			mod.i32.eq(cg.structGet.value.tag(binval.value), mod.i32.const(1)),
		));
	});

	test.test('#isComposite', () => {
		xjs.Array.forEachAggregated([
			new BinValue(cg, null),
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, bigint_to_i64(mod, 0x100n))),
			new BinValue(cg, new BinVect(mod, bigint_to_i64(mod, 42n))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
		], (binval) => assertEqualBins(
			binval.isComposite,
			mod.i32.eq(cg.structGet.value.tag(binval.value), mod.i32.const(2)),
		));
	});

	test.test('#asPrimitive', () => {
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
			const {asPrimitive} = binval;
			assertEqualBins(
				asPrimitive,
				cg.structGet.value.primitive(binval.value),
			);
			return assert.strictEqual(binaryen.getExpressionType(asPrimitive), binaryen.v128);
		});
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
			new BinValue(cg, new BinVect(mod))                                    .toProperty(0x100n),
			new BinValue(cg, new BinVect(mod, true).vect)                         .toProperty(0x101n),
			new BinValue(cg, genConst(cg))                                        .toProperty(0x102n),
			new BinValue(cg, genConst(cg, 42n))                                   .toProperty(0x103n),
			new BinValue(cg, new BinValue(cg, new BinVect(mod, false).vect).value).toProperty(0x104n),
			new BinValue(cg, new BinValue(cg, genConst(cg, 4.2)).value)           .toProperty(0x105n),
			new BinValue(cg, new BinValue(cg, genConst(cg, 4.2)).value)           .toProperty(0x106n),
		], ([
			[0x100n, new BinValue(cg, new BinVect(mod)).value],
			[0x101n, new BinValue(cg, new BinVect(mod, true).vect).value],
			[0x102n, genConst(cg)],
			[0x103n, genConst(cg, 42n)],
			[0x104n, new BinValue(cg, new BinVect(mod, false).vect).value],
			[0x105n, new BinValue(cg, genConst(cg, 4.2)).value],
			[0x106n, genConst(cg, 4.2)],
		] as const).map(([id, code]) => cg.module.struct.new([
			bigint_to_i64(cg.module, id, true),
			code,
		], cg.heaptype.Property)));
	});
});
