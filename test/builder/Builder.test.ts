import * as test from 'node:test';
import type * as binaryen from 'binaryen.ts';
import {
	type VirtualMachine,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {genConst} from '../helpers.ts';
import {repeat} from '../utils.ts';



test.suite('Builder', () => {
	/* eslint-disable @typescript-eslint/init-declarations */
	let cg:  Builder;
	let mod: VirtualMachine['mod'];
	/* eslint-enable @typescript-eslint/init-declarations */

	test.beforeEach(() => {
		cg = new Builder();
		mod = cg.vm.mod;
	});


	test.suite('#setupMain', () => {
		test.test('validates successfully.', () => {
			cg.setupMain(mod.nop()); // assert does not throw
		});
	});


	test.suite('#newVect', () => {
		test.test('returns `unreachable` arg.', () => {
			assertEqualBins(
				cg.newVect(mod.unreachable()),
				mod.unreachable(),
			);
		});
		test.test('returns v128.', () => {
			const {Vect} = cg.vm;
			assertEqualBins([
				cg.newVect(mod.i64.const(42n)),
				cg.newVect(mod.i64.const(42n), {unsigned: true}),
				cg.newVect(mod.f64.const(4.2)),
				cg.newVect(Vect.TRUE),
				cg.newVect(Vect.newInt(mod.i64.const(42n))),
			], ([
				Vect.newInt(mod.i64.const(42n)),
				Vect.newNat(mod.i64.const(42n)),
				Vect.newFloat(mod.f64.const(4.2)),
				Vect.TRUE,
				Vect.newInt(mod.i64.const(42n)),
			]));
		});
	});


	test.suite('#newProperty', () => {
		test.test('returns `unreachable` arg.', () => {
			assertEqualBins(
				cg.newProperty(0x10n, mod.unreachable()),
				mod.unreachable(),
			);
		});
		test.test('returns `(struct.new $Property)`.', () => {
			const {Vect, Value} = cg.vm;
			assertEqualBins([
				cg.newProperty(0x102n, genConst(cg)),
				cg.newProperty(0x103n, genConst(cg, 42n)),
				cg.newProperty(0x104n, Value.newPrimitive(Vect.FALSE)),
				cg.newProperty(0x105n, genConst(cg, 4.2)),
			], ([
				[0x102n, genConst(cg)],
				[0x103n, genConst(cg, 42n)],
				[0x104n, Value.newPrimitive(Vect.FALSE)],
				[0x105n, genConst(cg, 4.2)],
			] as const).map(([id, code]) => mod.struct.new([
				mod.i64.const(id),
				code,
			], cg.vm.heaptype.Property)));
		});
	});


	test.suite('#codegen*', () => {
		test.test('empty `#codegenString`.', () => {
			assertEqualBins(
				cg.codegenString(),
				mod.array.new_fixed(cg.vm.heaptype.String, []),
			);
		});
		test.test('`#codegenTuple` returns (array.new_fixed).', () => {
			const codeunits = [0x68, 0x65, 0x6c, 0x6c, 0x6f] as const; // 'hello' in UTF-8
			return assertEqualBins(
				cg.codegenString(codeunits.map((c) => mod.i32.const(c))),
				mod.array.new_fixed(cg.vm.heaptype.String, codeunits.map((c) => mod.i32.const(c))),
			);
		});
		test.test('empty `#codegenTuple`.', () => {
			assertEqualBins(
				cg.codegenTuple(),
				mod.array.new_fixed(cg.vm.heaptype.Tuple, []),
			);
		});
		test.test('`#codegenTuple` returns (array.new_fixed).', () => {
			assertEqualBins(
				cg.codegenTuple([
					genConst(cg, true),
					genConst(cg, 42n),
				]),
				mod.array.new_fixed(cg.vm.heaptype.Tuple, [
					genConst(cg, true),
					genConst(cg, 42n),
				]),
			);
		});
		test.test('empty `#codegenRecord`.', () => {
			assertEqualBins(
				cg.codegenRecord(),
				mod.array.new_fixed(cg.vm.heaptype.Record, []),
			);
		});
		test.test('`#codegenRecord` returns (array.new_fixed).', () => {
			assertEqualBins(
				cg.codegenRecord(new Map([
					[0x100n, cg.newProperty(0x100n, genConst(cg, true))],
					[0x101n, cg.newProperty(0x101n, genConst(cg, 42n))],
					[0x102n, cg.newProperty(0x102n, genConst(cg, 4.2))],
				])),
				mod.array.new_fixed(cg.vm.heaptype.Record, [
					cg.newProperty(0x102n, genConst(cg, 4.2)),
					cg.newProperty(0x100n, genConst(cg, true)),
					cg.newProperty(0x101n, genConst(cg, 42n)),
				]),
			);
		});
		test.test('empty `#codegenList`.', () => {
			assertEqualBins(
				cg.codegenList(),
				mod.struct.new([
					cg.vm.Object.ctrPlusPlus(),
					mod.i32.const(0),
					mod.array.new_fixed(
						cg.vm.heaptype.ListInternal,
						repeat(mod.ref.null(cg.vm.reftypeNull.Value), 8),
					),
				], cg.vm.heaptype.List),
			);
		});
		test.test('`#codegenList` returns (struct.new) with id, count, and internal array.', () => {
			assertEqualBins(
				cg.codegenList([
					genConst(cg, 1.1),
					genConst(cg, 2.2),
					genConst(cg, 3.3),
				]),
				mod.struct.new([
					cg.vm.Object.ctrPlusPlus(),
					mod.i32.const(3),
					mod.array.new_fixed(
						cg.vm.heaptype.ListInternal,
						[
							genConst(cg, 1.1),
							genConst(cg, 2.2),
							genConst(cg, 3.3),
							...repeat(mod.ref.null(cg.vm.reftypeNull.Value), 5),
						],
					),
				], cg.vm.heaptype.List),
			);
		});
		test.test('empty `#codegenDict`.', () => {
			assertEqualBins(
				cg.codegenDict(),
				mod.struct.new([
					cg.vm.Object.ctrPlusPlus(),
					mod.i32.const(0),
					mod.array.new_fixed(
						cg.vm.heaptype.DictInternal,
						repeat(mod.ref.null(cg.vm.reftypeNull.Property), 8),
					),
				], cg.vm.heaptype.Dict),
			);
		});
		test.test('`#codegenDict` (struct.new) with id, count, and internal array.', () => {
			assertEqualBins(
				cg.codegenDict(new Map([
					[0x106n, cg.newProperty(0x106n, genConst(cg, 1.1))],
					[0x107n, cg.newProperty(0x107n, genConst(cg, 2.2))],
					[0x108n, cg.newProperty(0x108n, genConst(cg, 3.3))],
					[0x109n, cg.newProperty(0x109n, genConst(cg, 4.4))],
					[0x10an, cg.newProperty(0x10an, genConst(cg, 5.5))],
				])),
				mod.struct.new([
					cg.vm.Object.ctrPlusPlus(),
					mod.i32.const(5),
					mod.array.new_fixed(
						cg.vm.heaptype.DictInternal,
						[
							cg.newProperty(0x108n, genConst(cg, 3.3)),
							cg.newProperty(0x109n, genConst(cg, 4.4)),
							cg.newProperty(0x10an, genConst(cg, 5.5)),
							...repeat(mod.ref.null(cg.vm.reftypeNull.Property), 3),
							cg.newProperty(0x106n, genConst(cg, 1.1)),
							cg.newProperty(0x107n, genConst(cg, 2.2)),
						],
					),
				], cg.vm.heaptype.Dict),
			);
		});
		test.test('empty `#codegenSet`.', () => {
			assertEqualBins(
				cg.codegenSet(),
				new Builder().codegenMap(),
			);
		});
		test.test('`#codegenSet` returns the result of calling `#codegenMap`.', () => {
			assertEqualBins(
				cg.codegenSet([
					genConst(cg, 1.1),
					genConst(cg, 2.2),
					genConst(cg, 3.3),
					genConst(cg, 4.4),
					genConst(cg, 5.5),
				]),
				new Builder().codegenMap(new Map([
					[genConst(cg, 1.1), genConst(cg)],
					[genConst(cg, 2.2), genConst(cg)],
					[genConst(cg, 3.3), genConst(cg)],
					[genConst(cg, 4.4), genConst(cg)],
					[genConst(cg, 5.5), genConst(cg)],
				])),
			);
		});
		test.test('empty `#codegenMap`.', () => {
			assertEqualBins(
				cg.codegenMap(),
				mod.struct.new([
					cg.vm.Object.ctrPlusPlus(),
					mod.i32.const(0),
					mod.array.new_default(cg.vm.heaptype.MapInternal, mod.i32.const(8)),
				], cg.vm.heaptype.Map),
			);
		});
		test.test('`#codegenMap` (block) containing (struct.new) with id, count, and internal array, with (call $Map.set).', () => {
			const {Object: VmObject, Map: VmMap} = cg.vm;
			const map_get: binaryen.ExpressionRef = mod.local.get(0, cg.vm.reftype.Map);
			return assertEqualBins(
				cg.codegenMap(new Map([
					[genConst(cg, 10n), genConst(cg, 1.1)],
					[genConst(cg, 20n), genConst(cg, 2.2)],
					[genConst(cg, 30n), genConst(cg, 3.3)],
					[genConst(cg, 40n), genConst(cg, 4.4)],
					[genConst(cg, 50n), genConst(cg, 5.5)],
				])),
				mod.block(null, [
					mod.local.set(0, mod.struct.new([
						VmObject.ctrPlusPlus(),
						mod.i32.const(5),
						mod.array.new_default(cg.vm.heaptype.MapInternal, mod.i32.const(8)),
					], cg.vm.heaptype.Map)),
					VmMap.set(map_get, genConst(cg, 10n), genConst(cg, 1.1)),
					VmMap.set(map_get, genConst(cg, 20n), genConst(cg, 2.2)),
					VmMap.set(map_get, genConst(cg, 30n), genConst(cg, 3.3)),
					VmMap.set(map_get, genConst(cg, 40n), genConst(cg, 4.4)),
					VmMap.set(map_get, genConst(cg, 50n), genConst(cg, 5.5)),
					map_get,
				], cg.vm.reftype.Map),
			);
		});

		test.test('Records: hashing collisions are resolved in source order.', () => {
			`{
				% sym  | id  | mod 3
				% ---- | --- | ----
				@b;    % 256 % 1
				@c;    % 257 % 2
				@a;    % 258 % 0
				@bb;   % 259 % 1
				@cc;   % 260 % 2
				@aa;   % 261 % 0
				@bbb;  % 262 % 1
				@ccc;  % 263 % 2
				@aaa;  % 264 % 0
				(a= 42, aa= false, b= 4.2); % (258, 261, 256)
				%%
					(???,         ???,         ???)
					(258,         ???,         ???)
					(258 & 261->, ???,         ???)
					(258,         261,         ???)
					(258,         261 & 256->, ???)
					(258,         261,         256) % (a, aa, b)
				%%
				(aa= true, c= null, a= 42); % (261, 257, 258)
				%%
					(???,         ???,         ???)
					(261,         ???,         ???)
					(261,         ???,         257)
					(261 & 258->, ???,         257)
					(261,         258,         257) % (aa, a, c)
				%%
				(b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
				%%
					(???,         256,         ???)
					(???,         256 & 259->, ???)
					(???,         256,         259)
					(???,         256 & 262->, 259)
					(???,         256,         259 & 262->)
					(262,         256,         259)         % (bbb, b, bb)
				%%
			}`;
			return assertEqualBins(
				[new Map([
					// (a= 42, aa= false, b= 4.2); % (258, 261, 256)
					[258n, cg.newProperty(258n, genConst(cg, 42n))],
					[261n, cg.newProperty(261n, genConst(cg, false))],
					[256n, cg.newProperty(256n, genConst(cg, 4.2))],
				]), new Map([
					// (aa= true, c= null, a= 42); % (261, 257, 258)
					[261n, cg.newProperty(261n, genConst(cg, true))],
					[257n, cg.newProperty(257n, genConst(cg))],
					[258n, cg.newProperty(258n, genConst(cg, 42n))],
				]), new Map([
					// (b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
					[256n, cg.newProperty(256n, genConst(cg, 42n))],
					[259n, cg.newProperty(259n, genConst(cg, 4.2))],
					[262n, cg.newProperty(262n, genConst(cg))],
				])].map((props) => cg.codegenRecord(props)),
				[[
					// (258,         261,         256) % (a, aa, b)
					cg.newProperty(258n, genConst(cg, 42n)),
					cg.newProperty(261n, genConst(cg, false)),
					cg.newProperty(256n, genConst(cg, 4.2)),
				], [
					// (261,         258,         257) % (aa, a, c)
					cg.newProperty(261n, genConst(cg, true)),
					cg.newProperty(258n, genConst(cg, 42n)),
					cg.newProperty(257n, genConst(cg)),
				], [
					// (262,         256,         259)         % (bbb, b, bb)
					cg.newProperty(262n, genConst(cg)),
					cg.newProperty(256n, genConst(cg, 42n)),
					cg.newProperty(259n, genConst(cg, 4.2)),
				]].map((entries) => mod.array.new_fixed(cg.vm.heaptype.Record, entries)),
			);
		});

		test.test('Dicts: hashing collisions are resolved in source order.', () => {
			`{
				% sym  | id  | mod 8
				% ---- | --- | ----
				@b;    % 256 % 0
				@c;    % 257 % 1
				@a;    % 258 % 2
				@bb;   % 259 % 3
				@cc;   % 260 % 4
				@aa;   % 261 % 5
				@bbb;  % 262 % 6
				@ccc;  % 263 % 7
				@aaa;  % 264 % 0
				[a= 42, aa= false, b= 4.2]; % (258, 261, 256)
				%%
					(???,         ???,         ???,         ???,         ???,         ???,         ???,         ???)
					(???,         ???,         258,         ???,         ???,         ???,         ???,         ???)
					(???,         ???,         258,         ???,         ???,         261,         ???,         ???)
					(256,         ???,         258,         ???,         ???,         261,         ???,         ???) % (b, -, a, -, -, aa, -, -)
				%%
				[aa= true, c= null, a= 42]; % (261, 257, 258)
				%%
					(???,         ???,         ???,         ???,         ???,         ???,         ???,         ???)
					(???,         ???,         ???,         ???,         ???,         261,         ???,         ???)
					(???,         257,         ???,         ???,         ???,         261,         ???,         ???)
					(???,         257,         258,         ???,         ???,         261,         ???,         ???) % (-, c, a, -, -, aa, -, -)
				%%
				[b= 42, c= 4.2, aaa= null]; % (256, 257, 264)
				%%
					(???,         ???,         ???,         ???,         ???,         ???,         ???,         ???)
					(256,         ???,         ???,         ???,         ???,         ???,         ???,         ???)
					(256,         257,         ???,         ???,         ???,         ???,         ???,         ???)
					(256 & 264->, 257,         ???,         ???,         ???,         ???,         ???,         ???)
					(256,         257 & 264->, ???,         ???,         ???,         ???,         ???,         ???)
					(256,         257,         264,         ???,         ???,         ???,         ???,         ???) % (b, c, aaa, -, -, -, -, -)
				%%
			}`;
			const WASM_NULL: binaryen.ExpressionRef = mod.ref.null(cg.vm.reftypeNull.Property);
			return assertEqualBins(
				[new Map([
					// [a= 42, aa= false, b= 4.2]; % (258, 261, 256)
					[258n, cg.newProperty(258n, genConst(cg, 42n))],
					[261n, cg.newProperty(261n, genConst(cg, false))],
					[256n, cg.newProperty(256n, genConst(cg, 4.2))],
				]), new Map([
					// [aa= true, c= null, a= 42]; % (261, 257, 258)
					[261n, cg.newProperty(261n, genConst(cg, true))],
					[257n, cg.newProperty(257n, genConst(cg))],
					[258n, cg.newProperty(258n, genConst(cg, 42n))],
				]), new Map([
					// [b= 42, c= 4.2, aaa= null]; % (256, 257, 264)
					[256n, cg.newProperty(256n, genConst(cg, 42n))],
					[257n, cg.newProperty(257n, genConst(cg, 4.2))],
					[264n, cg.newProperty(264n, genConst(cg))],
				])].map((props) => cg.codegenDict(props)),
				[[
					// (256,         ???,         258,         ???,         ???,         261,         ???,         ???) % (b, -, a, -, -, aa, -, -)
					cg.newProperty(256n, genConst(cg, 4.2)),
					WASM_NULL,
					cg.newProperty(258n, genConst(cg, 42n)),
					WASM_NULL,
					WASM_NULL,
					cg.newProperty(261n, genConst(cg, false)),
					WASM_NULL,
					WASM_NULL,
				], [
					// (???,         257,         258,         ???,         ???,         261,         ???,         ???) % (-, c, a, -, -, aa, -, -)
					WASM_NULL,
					cg.newProperty(257n, genConst(cg)),
					cg.newProperty(258n, genConst(cg, 42n)),
					WASM_NULL,
					WASM_NULL,
					cg.newProperty(261n, genConst(cg, true)),
					WASM_NULL,
					WASM_NULL,
				], [
					// (256,         257,         264,         ???,         ???,         ???,         ???,         ???) % (b, c, aaa, -, -, -, -, -)
					cg.newProperty(256n, genConst(cg, 42n)),
					cg.newProperty(257n, genConst(cg, 4.2)),
					cg.newProperty(264n, genConst(cg)),
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
				]].map((entries) => mod.struct.new([
					cg.vm.Object.ctrPlusPlus(),
					mod.i32.const(3),
					mod.array.new_fixed(cg.vm.heaptype.DictInternal, entries),
				], cg.vm.heaptype.Dict)),
			);
		});
	});
});
