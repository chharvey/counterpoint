import * as test from 'node:test';
import {
	VirtualMachine,
	bigint_to_i64,
	Builder,
} from '../../../src/index.ts';
import {assertEqualBins} from '../../assert-helpers.ts';
import {genConst} from '../../helpers.ts';



test.suite('Property', () => {
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
				vm.Property.new(0x10n, mod.unreachable()),
				mod.unreachable(),
			);
		});
		test.test('returns `(struct.new $Property)`.', () => {
			const cg = new Builder(vm);
			assertEqualBins([
				vm.Property.new(0x102n, genConst(cg)),
				vm.Property.new(0x103n, genConst(cg, 42n)),
				vm.Property.new(0x104n, cg.vm.Value.new(cg.vm.Vect.new(false))),
				vm.Property.new(0x105n, cg.vm.Value.new(genConst(cg, 4.2))),
				vm.Property.new(0x106n, cg.vm.Value.new(genConst(cg, 4.2))),
			], ([
				[0x102n, genConst(cg)],
				[0x103n, genConst(cg, 42n)],
				[0x104n, cg.vm.Value.new(cg.vm.Vect.new(false))],
				[0x105n, cg.vm.Value.new(genConst(cg, 4.2))],
				[0x106n, genConst(cg, 4.2)],
			] as const).map(([id, code]) => cg.module.struct.new([
				bigint_to_i64(cg.module, id, true),
				code,
			], cg.heaptype.Property)));
		});
	});
});
