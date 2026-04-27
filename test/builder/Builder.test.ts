import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	bigint_to_i64,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {genConst} from '../helpers.ts';
import {repeat} from '../utils.ts';



test.suite('Builder', () => {
	test.suite('#setupMain', () => {
		test.test('validates successfully.', () => {
			new Builder().setupMain(); // assert does not throw
		});
	});


	test.suite('#codegen*', () => {
		function obj_ctr_plus_plus(mod: Builder['module']): binaryen.ExpressionRef {
			return mod.block(null, [
				mod.global.set('obj-ctr', mod.i64.add(mod.global.get('obj-ctr', binaryen.i64), bigint_to_i64(mod, 1n, true))),
				mod.i64.sub(mod.global.get('obj-ctr', binaryen.i64), bigint_to_i64(mod, 1n, true)),
			], binaryen.i64);
		}
		xjs.Map.forEachAggregated(new Map<string, (cg: Builder) => [binaryen.ExpressionRef, binaryen.ExpressionRef]>([
			['empty `#codegenString`.', (cg) => [
				cg.codegenString(),
				cg.module.array.new_fixed(cg.heaptype.String, []),
			]],
			['`#codegenTuple` returns (array.new_fixed).', (cg) => {
				const codeunits = [0x68, 0x65, 0x6c, 0x6c, 0x6f] as const; // 'hello' in UTF-8
				return [
					cg.codegenString(codeunits.map((c) => cg.module.i32.const(c))),
					cg.module.array.new_fixed(cg.heaptype.String, codeunits.map((c) => cg.module.i32.const(c))),
				];
			}],
			['empty `#codegenTuple`.', (cg) => [
				cg.codegenTuple(),
				cg.module.array.new_fixed(cg.heaptype.Tuple, []),
			]],
			['`#codegenTuple` returns (array.new_fixed).', (cg) => [
				cg.codegenTuple([
					genConst(cg, true),
					genConst(cg, 42n),
				]),
				cg.module.array.new_fixed(cg.heaptype.Tuple, [
					genConst(cg, true),
					genConst(cg, 42n),
				]),
			]],
			['empty `#codegenRecord`.', (cg) => [
				cg.codegenRecord(),
				cg.module.array.new_fixed(cg.heaptype.Record, []),
			]],
			['`#codegenRecord` returns (array.new_fixed).', (cg) => [
				cg.codegenRecord(new Map([
					[0x100n, cg.vm.Property.new(0x100n, genConst(cg, true))],
					[0x101n, cg.vm.Property.new(0x101n, genConst(cg, 42n))],
					[0x102n, cg.vm.Property.new(0x102n, genConst(cg, 4.2))],
				])),
				cg.module.array.new_fixed(cg.heaptype.Record, [
					cg.vm.Property.new(0x102n, genConst(cg, 4.2)),
					cg.vm.Property.new(0x100n, genConst(cg, true)),
					cg.vm.Property.new(0x101n, genConst(cg, 42n)),
				]),
			]],
			['empty `#codegenList`.', (cg) => [
				cg.codegenList(),
				cg.module.struct.new([
					obj_ctr_plus_plus(cg.module),
					cg.module.i32.const(0),
					cg.module.array.new_fixed(
						cg.heaptype.ListInternal,
						repeat(cg.module.ref.null(cg.reftypeNull.Value), 8),
					),
				], cg.heaptype.List),
			]],
			['`#codegenList` returns (struct.new) with id, count, and internal array.', (cg) => [
				cg.codegenList([
					genConst(cg, 1.1),
					genConst(cg, 2.2),
					genConst(cg, 3.3),
				]),
				cg.module.struct.new([
					obj_ctr_plus_plus(cg.module),
					cg.module.i32.const(3),
					cg.module.array.new_fixed(
						cg.heaptype.ListInternal,
						[
							genConst(cg, 1.1),
							genConst(cg, 2.2),
							genConst(cg, 3.3),
							...repeat(cg.module.ref.null(cg.reftypeNull.Value), 5),
						],
					),
				], cg.heaptype.List),
			]],
			['empty `#codegenDict`.', (cg) => [
				cg.codegenDict(),
				cg.module.struct.new([
					obj_ctr_plus_plus(cg.module),
					cg.module.i32.const(0),
					cg.module.array.new_fixed(
						cg.heaptype.DictInternal,
						repeat(cg.module.ref.null(cg.reftypeNull.Property), 8),
					),
				], cg.heaptype.Dict),
			]],
			['`#codegenDict` (struct.new) with id, count, and internal array.', (cg) => [
				cg.codegenDict(new Map([
					[0x106n, cg.vm.Property.new(0x106n, genConst(cg, 1.1))],
					[0x107n, cg.vm.Property.new(0x107n, genConst(cg, 2.2))],
					[0x108n, cg.vm.Property.new(0x108n, genConst(cg, 3.3))],
					[0x109n, cg.vm.Property.new(0x109n, genConst(cg, 4.4))],
					[0x10an, cg.vm.Property.new(0x10an, genConst(cg, 5.5))],
				])),
				cg.module.struct.new([
					obj_ctr_plus_plus(cg.module),
					cg.module.i32.const(5),
					cg.module.array.new_fixed(
						cg.heaptype.DictInternal,
						[
							cg.vm.Property.new(0x108n, genConst(cg, 3.3)),
							cg.vm.Property.new(0x109n, genConst(cg, 4.4)),
							cg.vm.Property.new(0x10an, genConst(cg, 5.5)),
							...repeat(cg.module.ref.null(cg.reftypeNull.Property), 3),
							cg.vm.Property.new(0x106n, genConst(cg, 1.1)),
							cg.vm.Property.new(0x107n, genConst(cg, 2.2)),
						],
					),
				], cg.heaptype.Dict),
			]],
			['empty `#codegenSet`.', (cg) => [
				cg.codegenSet(),
				new Builder().codegenMap(),
			]],
			['`#codegenSet` returns the result of calling `#codegenMap`.', (cg) => [
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
			]],
			['empty `#codegenMap`.', (cg) => {
				const mod = cg.module;
				return [
					cg.codegenMap(),
					mod.struct.new([
						obj_ctr_plus_plus(mod),
						mod.i32.const(0),
						mod.array.new_default(cg.heaptype.MapInternal, mod.i32.const(8)),
					], cg.heaptype.Map),
				];
			}],
			['`#codegenMap` (block) containing (struct.new) with id, count, and internal array, with (call $Map.set).', (cg) => {
				const mod = cg.module;
				const map_get: binaryen.ExpressionRef = mod.local.get(0, cg.reftype.Map);
				return [
					cg.codegenMap(new Map([
						[genConst(cg, 10n), genConst(cg, 1.1)],
						[genConst(cg, 20n), genConst(cg, 2.2)],
						[genConst(cg, 30n), genConst(cg, 3.3)],
						[genConst(cg, 40n), genConst(cg, 4.4)],
						[genConst(cg, 50n), genConst(cg, 5.5)],
					])),
					mod.block(null, [
						mod.local.set(0, mod.struct.new([
							obj_ctr_plus_plus(mod),
							mod.i32.const(5),
							mod.array.new_default(cg.heaptype.MapInternal, mod.i32.const(8)),
						], cg.heaptype.Map)),
						mod.call('Map.set', [map_get, genConst(cg, 10n), genConst(cg, 1.1)], binaryen.none),
						mod.call('Map.set', [map_get, genConst(cg, 20n), genConst(cg, 2.2)], binaryen.none),
						mod.call('Map.set', [map_get, genConst(cg, 30n), genConst(cg, 3.3)], binaryen.none),
						mod.call('Map.set', [map_get, genConst(cg, 40n), genConst(cg, 4.4)], binaryen.none),
						mod.call('Map.set', [map_get, genConst(cg, 50n), genConst(cg, 5.5)], binaryen.none),
						map_get,
					], cg.reftype.Map),
				];
			}],
		]), (bins, description) => {
			test.test(description, () => {
				const [actual, expected] = bins(new Builder());
				assertEqualBins(actual, expected);
			});
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
			const cg  = new Builder();
			const mod = cg.module;
			return assertEqualBins(
				[new Map([
					// (a= 42, aa= false, b= 4.2); % (258, 261, 256)
					[258n, cg.vm.Property.new(258n, genConst(cg, 42n))],
					[261n, cg.vm.Property.new(261n, genConst(cg, false))],
					[256n, cg.vm.Property.new(256n, genConst(cg, 4.2))],
				]), new Map([
					// (aa= true, c= null, a= 42); % (261, 257, 258)
					[261n, cg.vm.Property.new(261n, genConst(cg, true))],
					[257n, cg.vm.Property.new(257n, genConst(cg))],
					[258n, cg.vm.Property.new(258n, genConst(cg, 42n))],
				]), new Map([
					// (b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
					[256n, cg.vm.Property.new(256n, genConst(cg, 42n))],
					[259n, cg.vm.Property.new(259n, genConst(cg, 4.2))],
					[262n, cg.vm.Property.new(262n, genConst(cg))],
				])].map((props) => cg.codegenRecord(props)),
				[[
					// (258,         261,         256) % (a, aa, b)
					cg.vm.Property.new(258n, genConst(cg, 42n)),
					cg.vm.Property.new(261n, genConst(cg, false)),
					cg.vm.Property.new(256n, genConst(cg, 4.2)),
				], [
					// (261,         258,         257) % (aa, a, c)
					cg.vm.Property.new(261n, genConst(cg, true)),
					cg.vm.Property.new(258n, genConst(cg, 42n)),
					cg.vm.Property.new(257n, genConst(cg)),
				], [
					// (262,         256,         259)         % (bbb, b, bb)
					cg.vm.Property.new(262n, genConst(cg)),
					cg.vm.Property.new(256n, genConst(cg, 42n)),
					cg.vm.Property.new(259n, genConst(cg, 4.2)),
				]].map((entries) => mod.array.new_fixed(cg.heaptype.Record, entries)),
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
			const cg  = new Builder();
			const mod = cg.module;
			const WASM_NULL: binaryen.ExpressionRef = mod.ref.null(cg.reftypeNull.Property);
			return assertEqualBins(
				[new Map([
					// [a= 42, aa= false, b= 4.2]; % (258, 261, 256)
					[258n, cg.vm.Property.new(258n, genConst(cg, 42n))],
					[261n, cg.vm.Property.new(261n, genConst(cg, false))],
					[256n, cg.vm.Property.new(256n, genConst(cg, 4.2))],
				]), new Map([
					// [aa= true, c= null, a= 42]; % (261, 257, 258)
					[261n, cg.vm.Property.new(261n, genConst(cg, true))],
					[257n, cg.vm.Property.new(257n, genConst(cg))],
					[258n, cg.vm.Property.new(258n, genConst(cg, 42n))],
				]), new Map([
					// [b= 42, c= 4.2, aaa= null]; % (256, 257, 264)
					[256n, cg.vm.Property.new(256n, genConst(cg, 42n))],
					[257n, cg.vm.Property.new(257n, genConst(cg, 4.2))],
					[264n, cg.vm.Property.new(264n, genConst(cg))],
				])].map((props) => cg.codegenDict(props)),
				[[
					// (256,         ???,         258,         ???,         ???,         261,         ???,         ???) % (b, -, a, -, -, aa, -, -)
					cg.vm.Property.new(256n, genConst(cg, 4.2)),
					WASM_NULL,
					cg.vm.Property.new(258n, genConst(cg, 42n)),
					WASM_NULL,
					WASM_NULL,
					cg.vm.Property.new(261n, genConst(cg, false)),
					WASM_NULL,
					WASM_NULL,
				], [
					// (???,         257,         258,         ???,         ???,         261,         ???,         ???) % (-, c, a, -, -, aa, -, -)
					WASM_NULL,
					cg.vm.Property.new(257n, genConst(cg)),
					cg.vm.Property.new(258n, genConst(cg, 42n)),
					WASM_NULL,
					WASM_NULL,
					cg.vm.Property.new(261n, genConst(cg, true)),
					WASM_NULL,
					WASM_NULL,
				], [
					// (256,         257,         264,         ???,         ???,         ???,         ???,         ???) % (b, c, aaa, -, -, -, -, -)
					cg.vm.Property.new(256n, genConst(cg, 42n)),
					cg.vm.Property.new(257n, genConst(cg, 4.2)),
					cg.vm.Property.new(264n, genConst(cg)),
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
				]].map((entries) => mod.struct.new([
					obj_ctr_plus_plus(mod),
					mod.i32.const(3),
					mod.array.new_fixed(cg.heaptype.DictInternal, entries),
				], cg.heaptype.Dict)),
			);
		});
	});
});
