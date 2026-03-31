import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	BinValue,
	bigint_to_i64,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {genConst} from '../helpers.ts';
import {repeat} from '../utils.ts';



test.suite('Builder', () => {
	test.suite('#setupModule', () => {
		test.test('validates successfully.', () => {
			new Builder().setupModule(); // assert does not throw
		});
	});


	test.suite('#codegen*', () => {
		function obj_ctr_plus_plus(mod: Builder['module']): binaryen.ExpressionRef {
			return mod.block(null, [
				mod.global.get('obj-ctr', binaryen.i64),
				mod.global.set('obj-ctr', mod.i64.add(mod.global.get('obj-ctr', binaryen.i64), bigint_to_i64(mod, 1n, true))),
			], binaryen.i64);
		}
		xjs.Map.forEachAggregated(new Map<string, (cg: Builder) => [binaryen.ExpressionRef, binaryen.ExpressionRef]>([
			['empty `#codegenTuple`.', (cg) => [
				cg.codegenTuple(),
				cg.module.array.new_fixed(cg.getHeaptype('$Tuple'), []),
			]],
			['`#codegenTuple` returns (array.new_fixed).', (cg) => [
				cg.codegenTuple([
					genConst(cg, true),
					genConst(cg, 42n),
				]),
				cg.module.array.new_fixed(cg.getHeaptype('$Tuple'), [
					genConst(cg, true),
					genConst(cg, 42n),
				]),
			]],
			['empty `#codegenRecord`.', (cg) => [
				cg.codegenRecord(),
				cg.module.array.new_fixed(cg.getHeaptype('$Record'), []),
			]],
			['`#codegenRecord` returns (array.new_fixed).', (cg) => [
				cg.codegenRecord(new Map([
					[0x100n, new BinValue(cg, genConst(cg, true)).toProperty(0x100n)],
					[0x101n, new BinValue(cg, genConst(cg, 42n)) .toProperty(0x101n)],
					[0x102n, new BinValue(cg, genConst(cg, 4.2)) .toProperty(0x102n)],
				])),
				cg.module.array.new_fixed(cg.getHeaptype('$Record'), [
					new BinValue(cg, genConst(cg, 4.2)) .toProperty(0x102n),
					new BinValue(cg, genConst(cg, true)).toProperty(0x100n),
					new BinValue(cg, genConst(cg, 42n)) .toProperty(0x101n),
				]),
			]],
			['empty `#codegenList`.', (cg) => [
				cg.codegenList(),
				cg.module.struct.new([
					obj_ctr_plus_plus(cg.module),
					cg.module.i32.const(0),
					cg.module.array.new_fixed(
						cg.getHeaptype('$ListInternal'),
						repeat(cg.module.ref.null(cg.getReftype('(ref null $Value)')), 8),
					),
				], cg.getHeaptype('$List')),
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
						cg.getHeaptype('$ListInternal'),
						[
							genConst(cg, 1.1),
							genConst(cg, 2.2),
							genConst(cg, 3.3),
							...repeat(cg.module.ref.null(cg.getReftype('(ref null $Value)')), 5),
						],
					),
				], cg.getHeaptype('$List')),
			]],
			['empty `#codegenDict`.', (cg) => [
				cg.codegenDict(),
				cg.module.struct.new([
					obj_ctr_plus_plus(cg.module),
					cg.module.i32.const(0),
					cg.module.array.new_fixed(
						cg.getHeaptype('$DictInternal'),
						repeat(cg.module.ref.null(cg.getReftype('(ref null $Property)')), 8),
					),
				], cg.getHeaptype('$Dict')),
			]],
			['`#codegenDict` (struct.new) with id, count, and internal array.', (cg) => [
				cg.codegenDict(new Map([
					[0x106n, new BinValue(cg, genConst(cg, 1.1)).toProperty(0x106n)],
					[0x107n, new BinValue(cg, genConst(cg, 2.2)).toProperty(0x107n)],
					[0x108n, new BinValue(cg, genConst(cg, 3.3)).toProperty(0x108n)],
					[0x109n, new BinValue(cg, genConst(cg, 4.4)).toProperty(0x109n)],
					[0x10an, new BinValue(cg, genConst(cg, 5.5)).toProperty(0x10an)],
				])),
				cg.module.struct.new([
					obj_ctr_plus_plus(cg.module),
					cg.module.i32.const(5),
					cg.module.array.new_fixed(
						cg.getHeaptype('$DictInternal'),
						[
							new BinValue(cg, genConst(cg, 3.3)).toProperty(0x108n),
							new BinValue(cg, genConst(cg, 4.4)).toProperty(0x109n),
							new BinValue(cg, genConst(cg, 5.5)).toProperty(0x10an),
							...repeat(cg.module.ref.null(cg.getReftype('(ref null $Property)')), 3),
							new BinValue(cg, genConst(cg, 1.1)).toProperty(0x106n),
							new BinValue(cg, genConst(cg, 2.2)).toProperty(0x107n),
						],
					),
				], cg.getHeaptype('$Dict')),
			]],
			['empty `#codegenMap`.', (cg) => {
				const mod = cg.module;
				return [
					cg.codegenMap(),
					mod.struct.new([
						obj_ctr_plus_plus(mod),
						mod.i32.const(0),
						mod.array.new_default(cg.getHeaptype('$MapInternal'), mod.i32.const(8)),
					], cg.getHeaptype('$Map')),
				];
			}],
			['`#codegenMap` (block) containing (struct.new) with id, count, and internal array, with (call $Map.set).', (cg) => {
				const mod = cg.module;
				const rt_map:  binaryen.Type          = cg.getReftype('(ref $Map)');
				const map_get: binaryen.ExpressionRef = mod.local.get(0, rt_map);
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
							mod.array.new_default(cg.getHeaptype('$MapInternal'), mod.i32.const(8)),
						], cg.getHeaptype('$Map'))),
						mod.call('Map.set', [map_get, genConst(cg, 10n), genConst(cg, 1.1)], binaryen.none),
						mod.call('Map.set', [map_get, genConst(cg, 20n), genConst(cg, 2.2)], binaryen.none),
						mod.call('Map.set', [map_get, genConst(cg, 30n), genConst(cg, 3.3)], binaryen.none),
						mod.call('Map.set', [map_get, genConst(cg, 40n), genConst(cg, 4.4)], binaryen.none),
						mod.call('Map.set', [map_get, genConst(cg, 50n), genConst(cg, 5.5)], binaryen.none),
						map_get,
					], rt_map),
				];
			}],
		]), (bins, description) => {
			test.test(description, () => {
				const cg = new Builder();
				cg.setupModule();
				const [actual, expected] = bins(cg);
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
			cg.setupModule();
			return assertEqualBins(
				[new Map([
					// (a= 42, aa= false, b= 4.2); % (258, 261, 256)
					[258n, new BinValue(cg, genConst(cg, 42n))  .toProperty(258n)],
					[261n, new BinValue(cg, genConst(cg, false)).toProperty(261n)],
					[256n, new BinValue(cg, genConst(cg, 4.2))  .toProperty(256n)],
				]), new Map([
					// (aa= true, c= null, a= 42); % (261, 257, 258)
					[261n, new BinValue(cg, genConst(cg, true)).toProperty(261n)],
					[257n, new BinValue(cg, genConst(cg))      .toProperty(257n)],
					[258n, new BinValue(cg, genConst(cg, 42n)) .toProperty(258n)],
				]), new Map([
					// (b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
					[256n, new BinValue(cg, genConst(cg, 42n)).toProperty(256n)],
					[259n, new BinValue(cg, genConst(cg, 4.2)).toProperty(259n)],
					[262n, new BinValue(cg, genConst(cg))     .toProperty(262n)],
				])].map((props) => cg.codegenRecord(props)),
				[[
					// (258,         261,         256) % (a, aa, b)
					new BinValue(cg, genConst(cg, 42n))  .toProperty(258n),
					new BinValue(cg, genConst(cg, false)).toProperty(261n),
					new BinValue(cg, genConst(cg, 4.2))  .toProperty(256n),
				], [
					// (261,         258,         257) % (aa, a, c)
					new BinValue(cg, genConst(cg, true)).toProperty(261n),
					new BinValue(cg, genConst(cg, 42n)) .toProperty(258n),
					new BinValue(cg, genConst(cg))      .toProperty(257n),
				], [
					// (262,         256,         259)         % (bbb, b, bb)
					new BinValue(cg, genConst(cg))     .toProperty(262n),
					new BinValue(cg, genConst(cg, 42n)).toProperty(256n),
					new BinValue(cg, genConst(cg, 4.2)).toProperty(259n),
				]].map((entries) => mod.array.new_fixed(cg.getHeaptype('$Record'), entries)),
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
			cg.setupModule();
			const WASM_NULL: binaryen.ExpressionRef = mod.ref.null(cg.getReftype('(ref null $Property)'));
			return assertEqualBins(
				[new Map([
					// [a= 42, aa= false, b= 4.2]; % (258, 261, 256)
					[258n, new BinValue(cg, genConst(cg, 42n))  .toProperty(258n)],
					[261n, new BinValue(cg, genConst(cg, false)).toProperty(261n)],
					[256n, new BinValue(cg, genConst(cg, 4.2))  .toProperty(256n)],
				]), new Map([
					// [aa= true, c= null, a= 42]; % (261, 257, 258)
					[261n, new BinValue(cg, genConst(cg, true)).toProperty(261n)],
					[257n, new BinValue(cg, genConst(cg))      .toProperty(257n)],
					[258n, new BinValue(cg, genConst(cg, 42n)) .toProperty(258n)],
				]), new Map([
					// [b= 42, c= 4.2, aaa= null]; % (256, 257, 264)
					[256n, new BinValue(cg, genConst(cg, 42n)).toProperty(256n)],
					[257n, new BinValue(cg, genConst(cg, 4.2)).toProperty(257n)],
					[264n, new BinValue(cg, genConst(cg))     .toProperty(264n)],
				])].map((props) => cg.codegenDict(props)),
				[[
					// (256,         ???,         258,         ???,         ???,         261,         ???,         ???) % (b, -, a, -, -, aa, -, -)
					new BinValue(cg, genConst(cg, 4.2)).toProperty(256n),
					WASM_NULL,
					new BinValue(cg, genConst(cg, 42n)).toProperty(258n),
					WASM_NULL,
					WASM_NULL,
					new BinValue(cg, genConst(cg, false)).toProperty(261n),
					WASM_NULL,
					WASM_NULL,
				], [
					// (???,         257,         258,         ???,         ???,         261,         ???,         ???) % (-, c, a, -, -, aa, -, -)
					WASM_NULL,
					new BinValue(cg, genConst(cg))     .toProperty(257n),
					new BinValue(cg, genConst(cg, 42n)).toProperty(258n),
					WASM_NULL,
					WASM_NULL,
					new BinValue(cg, genConst(cg, true)).toProperty(261n),
					WASM_NULL,
					WASM_NULL,
				], [
					// (256,         257,         264,         ???,         ???,         ???,         ???,         ???) % (b, c, aaa, -, -, -, -, -)
					new BinValue(cg, genConst(cg, 42n)).toProperty(256n),
					new BinValue(cg, genConst(cg, 4.2)).toProperty(257n),
					new BinValue(cg, genConst(cg))     .toProperty(264n),
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
				]].map((entries) => mod.struct.new([
					obj_ctr_plus_plus(mod),
					mod.i32.const(3),
					mod.array.new_fixed(cg.getHeaptype('$DictInternal'), entries),
				], cg.getHeaptype('$Dict'))),
			);
		});
	});
});
