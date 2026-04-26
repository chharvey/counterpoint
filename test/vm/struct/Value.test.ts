import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VirtualMachine,
	BinValue,
	bigint_to_i64,
	Builder,
	BinVect,
} from '../../../src/index.ts';
import {assertEqualBins} from '../../assert-helpers.ts';
import {genConst} from '../../helpers.ts';
import {repeat} from '../../utils.ts';



test.suite('Value', () => {
	/* eslint-disable @typescript-eslint/init-declarations */
	let vm:  VirtualMachine;
	let mod: VirtualMachine['mod'];
	/* eslint-enable @typescript-eslint/init-declarations */

	test.beforeEach(() => {
		vm  = new VirtualMachine();
		mod = vm.mod;
	});


	test.suite('#new', () => {
		test.test('returns (nullish) `$Value` arg.', () => {
			xjs.Array.forEachAggregated([
				mod.ref.null(vm.reftypeNull.Value), // BUG: `ref.null` should only take heap types
				vm.Value.new(new BinVect(mod, bigint_to_i64(mod, 42n)).vect),
			], (arg) => assertEqualBins(
				vm.Value.new(arg),
				arg,
			));
		});
		test.test('returns `unreachable` arg.', () => {
			assertEqualBins(
				vm.Value.new(mod.unreachable()),
				mod.unreachable(),
			);
		});
		test.test('primitive values.', () => {
			xjs.Array.forEachAggregated([
				new BinVect(mod, null).vect,
				new BinVect(mod, false).vect,
				new BinVect(mod, bigint_to_i64(mod, 0x100n)).vect,
				new BinVect(mod, bigint_to_i64(mod, 42n)).vect,
				new BinVect(mod, mod.f64.const(4.2)).vect,
			], (arg) => assertEqualBins(vm.Value.new(arg), mod.struct.new([
				mod.i32.const(1),
				arg,
				mod.ref.null(binaryen.eqref),
			], vm.heaptype.Value)));
		});
		test.test('composite values.', () => {
			const cg = new Builder(vm);
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
			], (arg) => assertEqualBins(vm.Value.new(arg), mod.struct.new([
				mod.i32.const(2),
				mod.v128.const(new Uint8Array(16)),
				arg,
			], cg.heaptype.Value)));
		});
	});
});
