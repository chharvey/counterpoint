import * as test from 'node:test';
import binaryen from 'binaryen';
import {
	VirtualMachine,
	bigint_to_i64,
} from '../../../src/index.ts';
import {assertEqualBins} from '../../assert-helpers.ts';



test.suite('Vect', () => {
	/* eslint-disable @typescript-eslint/init-declarations */
	let vm:  VirtualMachine;
	let mod: VirtualMachine['mod'];
	/* eslint-enable @typescript-eslint/init-declarations */

	test.beforeEach(() => {
		vm  = new VirtualMachine();
		mod = vm.mod;
	});


	test.suite('#new', () => {
		test.test('returns `unreachable` arg.', () => {
			assertEqualBins(
				vm.Vect.new(mod.unreachable()),
				mod.unreachable(),
			);
		});
		test.test('returns v128.', () => {
			assertEqualBins([
				vm.Vect.new(null),
				vm.Vect.new(false),
				vm.Vect.new(true),
				vm.Vect.new(bigint_to_i64(mod, 42n)),
				vm.Vect.new(bigint_to_i64(mod, 42n, true), {unsigned: true}),
				vm.Vect.new(mod.f64.const(4.2)),
				mod.global.get('Vect.TRUE', binaryen.v128),
				mod.call('Vect.new-int', [bigint_to_i64(mod, 42n)], binaryen.v128),
			], ([
				mod.global.get('Vect.NULL', binaryen.v128),
				mod.global.get('Vect.FALSE', binaryen.v128),
				mod.global.get('Vect.TRUE', binaryen.v128),
				mod.call('Vect.new-int', [bigint_to_i64(mod, 42n)], binaryen.v128),
				mod.call('Vect.new-nat', [bigint_to_i64(mod, 42n, true)], binaryen.v128),
				mod.call('Vect.new-float', [mod.f64.const(4.2)], binaryen.v128),
				mod.global.get('Vect.TRUE', binaryen.v128),
				mod.call('Vect.new-int', [bigint_to_i64(mod, 42n)], binaryen.v128),
			]));
		});
	});
});
