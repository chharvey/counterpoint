import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	Property_new,
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
				mod.i32.const(0),
				binvect.vect,
				mod.ref.null(binaryen.eqref),
			], cg.getHeaptype('$Value')!)));
		});
		it('composite values.', () => {
			xjs.Array.forEachAggregated([
				cg.codegenTuple([
					genConst(cg, true),
					genConst(cg, 42n),
				]),
				cg.codegenRecord(new Map([
					[0x100n, Property_new(cg, 0x100n, genConst(cg, true))],
					[0x101n, Property_new(cg, 0x101n, genConst(cg, 42n))],
					[0x102n, Property_new(cg, 0x102n, genConst(cg, 4.2))],
				])),
				cg.codegenList([
					genConst(cg, 1.1),
					genConst(cg, 2.2),
					genConst(cg, 3.3),
					...repeat(cg.module.ref.null(cg.getReftype('(ref null $Value)')!), 5),
				]),
				cg.codegenDict(new Map([
					[0x106n, Property_new(cg, 0x106n, genConst(cg, 1.1))],
					[0x107n, Property_new(cg, 0x107n, genConst(cg, 2.2))],
					[0x108n, Property_new(cg, 0x108n, genConst(cg, 3.3))],
					[0x109n, Property_new(cg, 0x109n, genConst(cg, 4.4))],
					[0x10an, Property_new(cg, 0x10an, genConst(cg, 5.5))],
				])),
			], (composite) => assertEqualBins(new BinValue(cg, composite).value, mod.struct.new([
				mod.i32.const(1),
				mod.v128.const(new Uint8Array(16)),
				composite,
			], cg.getHeaptype('$Value')!)));
		});
	});

	it('#isPrimitive', () => {
		xjs.Array.forEachAggregated([
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, mod.i32.const(0x100))),
			new BinValue(cg, new BinVect(mod, mod.i32.const(42))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
		], (binval) => assertEqualBins(
			binval.isPrimitive,
			mod.i32.eqz(mod.struct.get(0, binval.value, cg.getReftype('(ref $Value)')!, false)),
		));
	});

	it('#isComposite', () => {
		xjs.Array.forEachAggregated([
			new BinValue(cg, new BinVect(mod, null)),
			new BinValue(cg, new BinVect(mod, false)),
			new BinValue(cg, new BinVect(mod, mod.i32.const(0x100))),
			new BinValue(cg, new BinVect(mod, mod.i32.const(42))),
			new BinValue(cg, new BinVect(mod, mod.f64.const(4.2))),
		], (binval) => assertEqualBins(
			binval.isComposite,
			mod.i32.eqz(binval.isPrimitive),
		));
	});
});
