import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	Property_new,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {genConst} from '../helpers.ts';
import {repeat} from '../utils.ts';



describe('Builder', () => {
	describe('#setupModule', () => {
		it('validates successfully.', () => {
			new Builder().setupModule(); // assert does not throw
		});
	});


	describe('#codegen*', () => {
		xjs.Map.forEachAggregated(new Map<string, (cg: Builder) => [binaryen.ExpressionRef, binaryen.ExpressionRef]>([
			['`#codegenTuple` returns (array.new_fixed).', (cg) => [
				cg.codegenTuple([
					genConst(cg, true),
					genConst(cg, 42n),
				]),
				cg.module.array.new_fixed(cg.getHeaptype('$Tuple')!, [
					genConst(cg, true),
					genConst(cg, 42n),
				]),
			]],
			['`#codegenRecord` returns (array.new_fixed).', (cg) => [
				cg.codegenRecord(new Map([
					[0x100n, Property_new(cg, 0x100n, genConst(cg, true))],
					[0x101n, Property_new(cg, 0x101n, genConst(cg, 42n))],
					[0x102n, Property_new(cg, 0x102n, genConst(cg, 4.2))],
				])),
				cg.module.array.new_fixed(cg.getHeaptype('$Record')!, [
					Property_new(cg, 0x102n, genConst(cg, 4.2)),
					Property_new(cg, 0x100n, genConst(cg, true)),
					Property_new(cg, 0x101n, genConst(cg, 42n)),
				]),
			]],
			['`#codegenList` returns (struct.new) with count and internal array.', (cg) => [
				cg.codegenList([
					genConst(cg, 1.1),
					genConst(cg, 2.2),
					genConst(cg, 3.3),
				]),
				cg.module.struct.new([
					cg.module.i32.const(3),
					cg.module.array.new_fixed(
						cg.getHeaptype('$ListInternal')!,
						[
							genConst(cg, 1.1),
							genConst(cg, 2.2),
							genConst(cg, 3.3),
							...repeat(cg.module.ref.null(cg.getReftype('(ref null $Value)')!), 5),
						],
					),
				], cg.getHeaptype('$List')!),
			]],
			['`#codegenDict` (struct.new) with count and internal array.', (cg) => [
				cg.codegenDict(new Map([
					[0x106n, Property_new(cg, 0x106n, genConst(cg, 1.1))],
					[0x107n, Property_new(cg, 0x107n, genConst(cg, 2.2))],
					[0x108n, Property_new(cg, 0x108n, genConst(cg, 3.3))],
					[0x109n, Property_new(cg, 0x109n, genConst(cg, 4.4))],
					[0x10an, Property_new(cg, 0x10an, genConst(cg, 5.5))],
				])),
				cg.module.struct.new([
					cg.module.i32.const(5),
					cg.module.array.new_fixed(
						cg.getHeaptype('$DictInternal')!,
						[
							Property_new(cg, 0x108n, genConst(cg, 3.3)),
							Property_new(cg, 0x109n, genConst(cg, 4.4)),
							Property_new(cg, 0x10an, genConst(cg, 5.5)),
							...repeat(cg.module.ref.null(cg.getReftype('(ref null $Property)')!), 3),
							Property_new(cg, 0x106n, genConst(cg, 1.1)),
							Property_new(cg, 0x107n, genConst(cg, 2.2)),
						],
					),
				], cg.getHeaptype('$Dict')!),
			]],
		]), (bins, description) => {
			it(description, () => { // TODO: v0.5: tail call
				const [actual, expected] = bins(new Builder());
				assertEqualBins(actual, expected);
			});
		});

		it('Records: hashing collisions are resolved in source order.', () => {
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
					[258n, Property_new(cg, 258n, genConst(cg, 42n))],
					[261n, Property_new(cg, 261n, genConst(cg, false))],
					[256n, Property_new(cg, 256n, genConst(cg, 4.2))],
				]), new Map([
					// (aa= true, c= null, a= 42); % (261, 257, 258)
					[261n, Property_new(cg, 261n, genConst(cg, true))],
					[257n, Property_new(cg, 257n, genConst(cg))],
					[258n, Property_new(cg, 258n, genConst(cg, 42n))],
				]), new Map([
					// (b= 42, bb= 4.2, bbb= null); % (256, 259, 262)
					[256n, Property_new(cg, 256n, genConst(cg, 42n))],
					[259n, Property_new(cg, 259n, genConst(cg, 4.2))],
					[262n, Property_new(cg, 262n, genConst(cg))],
				])].map((props) => cg.codegenRecord(props)),
				[[
					// (258,         261,         256) % (a, aa, b)
					Property_new(cg, 258n, genConst(cg, 42n)),
					Property_new(cg, 261n, genConst(cg, false)),
					Property_new(cg, 256n, genConst(cg, 4.2)),
				], [
					// (261,         258,         257) % (aa, a, c)
					Property_new(cg, 261n, genConst(cg, true)),
					Property_new(cg, 258n, genConst(cg, 42n)),
					Property_new(cg, 257n, genConst(cg)),
				], [
					// (262,         256,         259)         % (bbb, b, bb)
					Property_new(cg, 262n, genConst(cg)),
					Property_new(cg, 256n, genConst(cg, 42n)),
					Property_new(cg, 259n, genConst(cg, 4.2)),
				]].map((entries) => mod.array.new_fixed(cg.getHeaptype('$Record')!, entries)),
			);
		});

		it('Dicts: hashing collisions are resolved in source order.', () => {
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
			const WASM_NULL: binaryen.ExpressionRef = mod.ref.null(cg.getReftype('(ref null $Property)')!);
			return assertEqualBins(
				[new Map([
					// [a= 42, aa= false, b= 4.2]; % (258, 261, 256)
					[258n, Property_new(cg, 258n, genConst(cg, 42n))],
					[261n, Property_new(cg, 261n, genConst(cg, false))],
					[256n, Property_new(cg, 256n, genConst(cg, 4.2))],
				]), new Map([
					// [aa= true, c= null, a= 42]; % (261, 257, 258)
					[261n, Property_new(cg, 261n, genConst(cg, true))],
					[257n, Property_new(cg, 257n, genConst(cg))],
					[258n, Property_new(cg, 258n, genConst(cg, 42n))],
				]), new Map([
					// [b= 42, c= 4.2, aaa= null]; % (256, 257, 264)
					[256n, Property_new(cg, 256n, genConst(cg, 42n))],
					[257n, Property_new(cg, 257n, genConst(cg, 4.2))],
					[264n, Property_new(cg, 264n, genConst(cg))],
				])].map((props) => cg.codegenDict(props)),
				[[
					// (256,         ???,         258,         ???,         ???,         261,         ???,         ???) % (b, -, a, -, -, aa, -, -)
					Property_new(cg, 256n, genConst(cg, 4.2)),
					WASM_NULL,
					Property_new(cg, 258n, genConst(cg, 42n)),
					WASM_NULL,
					WASM_NULL,
					Property_new(cg, 261n, genConst(cg, false)),
					WASM_NULL,
					WASM_NULL,
				], [
					// (???,         257,         258,         ???,         ???,         261,         ???,         ???) % (-, c, a, -, -, aa, -, -)
					WASM_NULL,
					Property_new(cg, 257n, genConst(cg)),
					Property_new(cg, 258n, genConst(cg, 42n)),
					WASM_NULL,
					WASM_NULL,
					Property_new(cg, 261n, genConst(cg, true)),
					WASM_NULL,
					WASM_NULL,
				], [
					// (256,         257,         264,         ???,         ???,         ???,         ???,         ???) % (b, c, aaa, -, -, -, -, -)
					Property_new(cg, 256n, genConst(cg, 42n)),
					Property_new(cg, 257n, genConst(cg, 4.2)),
					Property_new(cg, 264n, genConst(cg)),
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
					WASM_NULL,
				]].map((entries) => mod.struct.new([
					mod.i32.const(3),
					mod.array.new_fixed(cg.getHeaptype('$DictInternal')!, entries),
				], cg.getHeaptype('$Dict')!)),
			);
		});
	});
});
