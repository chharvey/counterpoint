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
	const CG  = new Builder();
	const MOD = CG.module;

	describe('#value', () => {
		// FIXME:
		it.skip('given a null reference, returns unreachable', () => {
			xjs.Array.forEachAggregated([
				MOD.ref.null(CG.getReftype('(ref null $Value)')!),
				MOD.ref.null(CG.getReftype('(ref null $Property)')!),
			], (nullref) => assertEqualBins(new BinValue(CG, nullref).value, MOD.if(
				MOD.ref.is_null(nullref),
				MOD.unreachable(),
				nullref,
			)));
		});
		it('primitive values.', () => {
			xjs.Array.forEachAggregated([
				new BinVect(MOD, null),
				new BinVect(MOD, false),
				new BinVect(MOD, MOD.i32.const(0x100)),
				new BinVect(MOD, MOD.i32.const(42)),
				new BinVect(MOD, MOD.f64.const(4.2)),
			], (binvect) => assertEqualBins(new BinValue(CG, binvect).value, MOD.struct.new([
				MOD.i32.const(0),
				binvect.vect,
				MOD.ref.null(binaryen.eqref),
			], CG.getHeaptype('$Value')!)));
		});
		it('composite values.', () => {
			xjs.Array.forEachAggregated([
				MOD.array.new_fixed(CG.getHeaptype('$Tuple')!, [
					genConst(CG, true),
					genConst(CG, 42n),
				]),
				MOD.array.new_fixed(CG.getHeaptype('$Record')!, [
					Property_new(CG, 0x100n, genConst(CG, true)),
					Property_new(CG, 0x101n, genConst(CG, 42n)),
				]),
				MOD.struct.new([
					MOD.i32.const(3),
					MOD.array.new_fixed(
						CG.getHeaptype('$ListInternal')!,
						[
							genConst(CG, 1.1),
							genConst(CG, 2.2),
							genConst(CG, 3.3),
							...repeat(CG.module.ref.null(CG.getReftype('(ref null $Value)')!), 5),
						],
					),
				], CG.getHeaptype('$List')!),
				MOD.struct.new([
					MOD.i32.const(5),
					MOD.array.new_fixed(
						CG.getHeaptype('$DictInternal')!,
						[
							Property_new(CG, 0x108n, genConst(CG, 3.3)),
							Property_new(CG, 0x109n, genConst(CG, 4.4)),
							Property_new(CG, 0x10an, genConst(CG, 5.5)),
							...repeat(CG.module.ref.null(CG.getReftype('(ref null $Property)')!), 3),
							Property_new(CG, 0x106n, genConst(CG, 1.1)),
							Property_new(CG, 0x107n, genConst(CG, 2.2)),
						],
					),
				], CG.getHeaptype('$Dict')!),
			], (composite) => assertEqualBins(new BinValue(CG, composite).value, MOD.struct.new([
				MOD.i32.const(1),
				MOD.v128.const(new Uint8Array(16)),
				composite,
			], CG.getHeaptype('$Value')!)));
		});
	});

	it('#isPrimitive', () => {
		xjs.Array.forEachAggregated([
			new BinValue(CG, new BinVect(MOD, null)),
			new BinValue(CG, new BinVect(MOD, false)),
			new BinValue(CG, new BinVect(MOD, MOD.i32.const(0x100))),
			new BinValue(CG, new BinVect(MOD, MOD.i32.const(42))),
			new BinValue(CG, new BinVect(MOD, MOD.f64.const(4.2))),
		], (binval) => assertEqualBins(
			binval.isPrimitive,
			MOD.i32.eqz(MOD.struct.get(0, binval.value, CG.getReftype('(ref $Value)')!, false)),
		));
	});

	it('#isComposite', () => {
		xjs.Array.forEachAggregated([
			new BinValue(CG, new BinVect(MOD, null)),
			new BinValue(CG, new BinVect(MOD, false)),
			new BinValue(CG, new BinVect(MOD, MOD.i32.const(0x100))),
			new BinValue(CG, new BinVect(MOD, MOD.i32.const(42))),
			new BinValue(CG, new BinVect(MOD, MOD.f64.const(4.2))),
		], (binval) => assertEqualBins(
			binval.isComposite,
			MOD.i32.eqz(binval.isPrimitive),
		));
	});
});
