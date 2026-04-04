import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	STRUCT_FIELD,
	BinValue,
	Builder,
	BinVect,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {genConst} from '../helpers.ts';
import {repeat} from '../utils.ts';



describe('BinValue', () => {
	/* eslint-disable @typescript-eslint/init-declarations */
	let cg:  Builder;
	let mod: Builder['module'];
	/* eslint-enable @typescript-eslint/init-declarations */
	beforeEach(() => {
		cg  = new Builder();
		mod = cg.module;
	});

	describe('#value', () => {
		it('primitive values.', () => {
			xjs.Array.forEachAggregated([
				new BinVect(mod, null),
				new BinVect(mod, false),
				new BinVect(mod, mod.i32.const(0x100)),
				new BinVect(mod, mod.i32.const(42)),
				new BinVect(mod, mod.f64.const(4.2)),
			], (binvect) => assertEqualBins(new BinValue(cg, binvect).value, mod.struct.new([
				mod.i32.const(1),
				binvect.vect,
				mod.ref.null(binaryen.eqref),
			], cg.getHeaptype('$Value'))));
		});
		it('composite values.', () => {
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
					...repeat(cg.module.ref.null(cg.getReftype('(ref null $Value)')), 5),
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
			], cg.getHeaptype('$Value'))));
		});
		it('reuses `BinValue#value`.', () => {
			assertEqualBins(
				new BinValue(cg, genConst(cg, 42n)).value,
				genConst(cg, 42n),
			);
		});
	});

	it('#isPrimitive', () => {
		xjs.Array.forEachAggregated([
			new BinValue(cg, null),
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, mod.i32.const(0x100))),
			new BinValue(cg, new BinVect(mod, mod.i32.const(42))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
		], (binval) => assertEqualBins(
			binval.isPrimitive,
			mod.i32.eq(mod.struct.get(STRUCT_FIELD.VALUE_TAG, binval.value, binaryen.i32, false), mod.i32.const(1)),
		));
	});

	it('#isComposite', () => {
		xjs.Array.forEachAggregated([
			new BinValue(cg, null),
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, mod.i32.const(0x100))),
			new BinValue(cg, new BinVect(mod, mod.i32.const(42))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
		], (binval) => assertEqualBins(
			binval.isComposite,
			mod.i32.eq(mod.struct.get(STRUCT_FIELD.VALUE_TAG, binval.value, binaryen.i32, false), mod.i32.const(2)),
		));
	});

	it('#primitiveValue', () => {
		xjs.Array.forEachAggregated([
			// `$Value`s with primitive filled
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, mod.i32.const(0x100))),
			new BinValue(cg, new BinVect(mod, mod.i32.const(42))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
			// `$Value`s with composite filled
			new BinValue(cg, cg.codegenTuple()),
			new BinValue(cg, cg.codegenRecord()),
			new BinValue(cg, cg.codegenList()),
			new BinValue(cg, cg.codegenDict()),
		], (binval) => {
			const {primitiveValue} = binval;
			assertEqualBins(
				primitiveValue,
				mod.struct.get(STRUCT_FIELD.VALUE_PRIMITIVE, binval.value, binaryen.v128),
			);
			return assert.strictEqual(binaryen.getExpressionType(primitiveValue), binaryen.v128);
		});
	});

	it('#compositeValue', () => {
		xjs.Array.forEachAggregated([
			// `$Value`s with primitive filled
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, mod.i32.const(0x100))),
			new BinValue(cg, new BinVect(mod, mod.i32.const(42))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
			// `$Value`s with composite filled
			new BinValue(cg, cg.codegenTuple()),
			new BinValue(cg, cg.codegenRecord()),
			new BinValue(cg, cg.codegenList()),
			new BinValue(cg, cg.codegenDict()),
		], (binval) => {
			const {compositeValue} = binval;
			assertEqualBins(
				compositeValue,
				mod.struct.get(STRUCT_FIELD.VALUE_COMPOSITE, binval.value, binaryen.eqref),
			);
			return assert.strictEqual(binaryen.getExpressionType(compositeValue), binaryen.eqref);
		});
	});

	it('#toProperty', () => {
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
			cg.module.i64.const(Number(id), 0), // TODO: v0.5: use `bigint_to_i64(cg.module, id, true)`
			code,
		], cg.getHeaptype('$Property'))));
	});
});
