import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	VirtualMachine,
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
		test.test('returns `(struct.new_default $Value)` with native `null` argument.', () => {
			assertEqualBins(
				vm.Value.new(null),
				mod.struct.new_default(vm.heaptype.Value),
			);
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
					[0x100n, cg.vm.Property.new(0x100n, genConst(cg, true))],
					[0x101n, cg.vm.Property.new(0x101n, genConst(cg, 42n))],
					[0x102n, cg.vm.Property.new(0x102n, genConst(cg, 4.2))],
				])),
				cg.codegenList([
					genConst(cg, 1.1),
					genConst(cg, 2.2),
					genConst(cg, 3.3),
					...repeat(cg.module.ref.null(cg.reftypeNull.Value), 5),
				]),
				cg.codegenDict(new Map([
					[0x106n, cg.vm.Property.new(0x106n, genConst(cg, 1.1))],
					[0x107n, cg.vm.Property.new(0x107n, genConst(cg, 2.2))],
					[0x108n, cg.vm.Property.new(0x108n, genConst(cg, 3.3))],
					[0x109n, cg.vm.Property.new(0x109n, genConst(cg, 4.4))],
					[0x10an, cg.vm.Property.new(0x10an, genConst(cg, 5.5))],
				])),
			], (arg) => assertEqualBins(vm.Value.new(arg), mod.struct.new([
				mod.i32.const(2),
				mod.v128.const(new Uint8Array(16)),
				arg,
			], cg.heaptype.Value)));
		});
	});
});
