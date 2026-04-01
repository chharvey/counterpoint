import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import {
	type AST,
	VALUE,
	drop_then,
	Builder,
} from '../../src/index.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {
	setupScript,
	buildConst,
} from '../helpers.ts';



test.suite('drop_then', () => {
	test.test('returns a (block) containing `n - 1` (drop) exprs followed by a last expr.', () => {
		const builder = new Builder();
		const expr1: binaryen.ExpressionRef = buildConst(builder, 1n);
		const expr2: binaryen.ExpressionRef = buildConst(builder, 2n);
		const expr3: binaryen.ExpressionRef = buildConst(builder, 3n);
		assert.strictEqual(binaryen.getExpressionType(expr3), binaryen.v128);
		return assertEqualBins(
			drop_then(builder.module, [expr1, expr2], expr3),
			builder.module.block(null, [builder.module.drop(expr1), builder.module.drop(expr2), expr3], binaryen.v128),
		);
	});
	test.test('type of (block) is `binaryen.none` if last item is a Counterpoint block.', () => {
		const builder = new Builder();
		const expr1: binaryen.ExpressionRef = buildConst(builder, 1n);
		const block: binaryen.ExpressionRef = builder.module.block(null, [
			builder.module.drop(buildConst(builder, 2n)),
			builder.module.drop(buildConst(builder, 3n)),
		]); // result of building ASTNodeBlock
		assert.strictEqual(binaryen.getExpressionType(block), binaryen.none);
		return assertEqualBins(
			drop_then(builder.module, [expr1], block),
			builder.module.block(null, [builder.module.drop(expr1), block]),
		);
	});
});



test.suite('build_tuple_like', () => {
	test.suite('<AST.ASTNodeExpression>', () => {
		test.test('returns `(struct.new)`.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				(x, 2.0);
			}`);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new([mod.local.get(0, binaryen.v128), buildConst(goal.builder, 2.0)], tb.getTempHeapType(0)),
			);
		});

		test.test('empty tuple returns `(struct.new_default)`.', () => {
			const {stmts, mod, tb} = setupScript(`{
				();
			}`);
			return assertEqualBins(
				(stmts[0] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new_default(tb.getTempHeapType(0)),
			);
		});

		test.test('boxed tuple with many items.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				((x, 2.0, true),);
			}`);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new([mod.struct.new([
					mod.local.get(0, binaryen.v128),
					buildConst(goal.builder, 2.0),
					buildConst(goal.builder, true),
				], tb.getTempHeapType(0))], tb.getTempHeapType(1)),
			);
		});

		test.test('nested tuples.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				(x, (2.0,), (3, (4.0,)));
			}`);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new([
					mod.local.get(0, binaryen.v128),
					mod.struct.new([buildConst(goal.builder, 2.0)], tb.getTempHeapType(0)),
					mod.struct.new([
						buildConst(goal.builder, 3n),
						mod.struct.new([buildConst(goal.builder, 4.0)], tb.getTempHeapType(1)),
					], tb.getTempHeapType(2)),
				], tb.getTempHeapType(3)),
			);
		});

		test.test('multiple entries.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				((x, (2.0, 3)), (4.0, (5, 6.0)), (7, ()));
			}`);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new([
					mod.struct.new([
						mod.local.get(0, binaryen.v128),
						mod.struct.new([buildConst(goal.builder, 2.0), buildConst(goal.builder, 3n)], tb.getTempHeapType(0)),
					], tb.getTempHeapType(1)),
					mod.struct.new([
						buildConst(goal.builder, 4.0),
						mod.struct.new([buildConst(goal.builder, 5n), buildConst(goal.builder, 6.0)], tb.getTempHeapType(2)),
					], tb.getTempHeapType(3)),
					mod.struct.new([
						buildConst(goal.builder, 7n),
						mod.struct.new_default(tb.getTempHeapType(4)),
					], tb.getTempHeapType(5)),
				], tb.getTempHeapType(6)),
			);
		});

		test.test('pointer entries.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut inner01: (float, int)   = (2.0, 3);
				val mut inner11: (int,   float) = (5,   6.0);
				val mut inner2:  (int,   ())    = (7,   ());

				val mut inner0: (int,   (float, int))   = (1,   inner01);
				val mut inner1: (float, (int,   float)) = (4.0, inner11);

				val tuple: ((int, (float, int)), (float, (int, float)), (int, ())) = (inner0, inner1, inner2);
			}`);
			return assertEqualBins(
				stmts.map((stmt) => (stmt as AST.ASTNodeDeclarationVariable).assigned!.build()),
				[
					mod.struct.new([buildConst(goal.builder, 2.0), buildConst(goal.builder, 3n)],  tb.getTempHeapType(0)),
					mod.struct.new([buildConst(goal.builder, 5n),  buildConst(goal.builder, 6.0)], tb.getTempHeapType(1)),
					mod.struct.new([
						buildConst(goal.builder, 7n),
						mod.struct.new_default(tb.getTempHeapType(2)),
					], tb.getTempHeapType(3)),

					mod.struct.new([buildConst(goal.builder, 1n),  mod.local.get(0, tb.getTempHeapType(0))], tb.getTempHeapType(4)),
					mod.struct.new([buildConst(goal.builder, 4.0), mod.local.get(1, tb.getTempHeapType(1))], tb.getTempHeapType(5)),

					mod.struct.new([
						mod.local.get(3, tb.getTempHeapType(4)),
						mod.local.get(4, tb.getTempHeapType(5)),
						mod.local.get(2, tb.getTempHeapType(3)),
					], tb.getTempHeapType(6)),
				],
			);
		});
	});


	test.suite('<VALUE.Value>', () => {
		let builder: Builder; // eslint-disable-line @typescript-eslint/init-declarations

		test.beforeEach(() => {
			builder = new Builder();
		});

		test.test('returns `(struct.new)`.', () => {
			assertEqualBins(
				new VALUE.Tuple([VALUE.INT_1, new VALUE.Float(2.0)]).build(builder),
				builder.module.struct.new([buildConst(builder, 1n), buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
			);
		});

		test.test('empty tuple returns `(struct.new_default)`.', () => {
			assertEqualBins(
				new VALUE.Tuple().build(builder),
				builder.module.struct.new_default(builder.typeBuilder.getTempHeapType(0)),
			);
		});

		test.test('boxed tuple with many items.', () => {
			assertEqualBins(
				new VALUE.Tuple([new VALUE.Tuple([
					VALUE.INT_1,
					new VALUE.Float(2.0),
					VALUE.TRUE,
				])]).build(builder),
				builder.module.struct.new([builder.module.struct.new([
					buildConst(builder, 1n),
					buildConst(builder, 2.0),
					buildConst(builder, true),
				], builder.typeBuilder.getTempHeapType(0))], builder.typeBuilder.getTempHeapType(1)),
			);
		});

		test.test('nested tuples.', () => {
			assertEqualBins(
				new VALUE.Tuple([
					VALUE.INT_1,
					new VALUE.Tuple([new VALUE.Float(2.0)]),
					new VALUE.Tuple([
						new VALUE.Integer(3n),
						new VALUE.Tuple([new VALUE.Float(4.0)]),
					]),
				]).build(builder),
				builder.module.struct.new([
					buildConst(builder, 1n),
					builder.module.struct.new([buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
					builder.module.struct.new([
						buildConst(builder, 3n),
						builder.module.struct.new([buildConst(builder, 4.0)], builder.typeBuilder.getTempHeapType(1)),
					], builder.typeBuilder.getTempHeapType(2)),
				], builder.typeBuilder.getTempHeapType(3)),
			);
		});

		test.test('multiple entries.', () => {
			assertEqualBins(
				new VALUE.Tuple([
					new VALUE.Tuple([
						VALUE.INT_1,
						new VALUE.Tuple([
							new VALUE.Float(2.0),
							new VALUE.Integer(3n),
						]),
					]),
					new VALUE.Tuple([
						new VALUE.Float(4.0),
						new VALUE.Tuple([
							new VALUE.Integer(5n),
							new VALUE.Float(6.0),
						]),
					]),
					new VALUE.Tuple([
						new VALUE.Integer(7n),
						new VALUE.Tuple(),
					]),
				]).build(builder),
				builder.module.struct.new([
					builder.module.struct.new([
						buildConst(builder, 1n),
						builder.module.struct.new([buildConst(builder, 2.0), buildConst(builder, 3n)], builder.typeBuilder.getTempHeapType(0)),
					], builder.typeBuilder.getTempHeapType(1)),
					builder.module.struct.new([
						buildConst(builder, 4.0),
						builder.module.struct.new([buildConst(builder, 5n), buildConst(builder, 6.0)], builder.typeBuilder.getTempHeapType(2)),
					], builder.typeBuilder.getTempHeapType(3)),
					builder.module.struct.new([
						buildConst(builder, 7n),
						builder.module.struct.new_default(builder.typeBuilder.getTempHeapType(4)),
					], builder.typeBuilder.getTempHeapType(5)),
				], builder.typeBuilder.getTempHeapType(6)),
			);
		});
	});
});



test.suite('build_record_like', () => {
	test.suite('<AST.ASTNodeExpression>', () => {
		test.test('returns `(struct.new)`.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				(a= x, b= 2.0);
			}`);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new([mod.local.get(0, binaryen.v128), buildConst(goal.builder, 2.0)], tb.getTempHeapType(0)),
			);
		});

		test.test('if source order differs from key order, returns a `(block)` with `(set)`s followed by a `(struct.new)` with `(get)`s.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				(a= x, b= 2.0); % establishes key order
				(b= 2.0, a= x);
			}`);
			return assertEqualBins(
				(stmts[2] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.block(null, [
					mod.local.set(1, buildConst(goal.builder, 2.0)),
					mod.local.set(2, mod.local.get(0, binaryen.v128)),
					mod.struct.new([
						mod.local.get(2, binaryen.v128),
						mod.local.get(1, binaryen.v128),
					], tb.getTempHeapType(0)),
				], tb.getTempHeapType(0)),
			);
		});

		test.test('boxed record with many props.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				(a= (a= x, b= 2.0, c= true));
			}`);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new([mod.struct.new([
					mod.local.get(0, binaryen.v128),
					buildConst(goal.builder, 2.0),
					buildConst(goal.builder, true),
				], tb.getTempHeapType(0))], tb.getTempHeapType(1)),
			);
		});

		test.test('nested records.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				(a= x, b= (a= 2.0), c= (a= 3, b= (a= 4.0)));
			}`);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new([
					mod.local.get(0, binaryen.v128),
					mod.struct.new([buildConst(goal.builder, 2.0)], tb.getTempHeapType(0)),
					mod.struct.new([
						buildConst(goal.builder, 3n),
						mod.struct.new([buildConst(goal.builder, 4.0)], tb.getTempHeapType(1)),
					], tb.getTempHeapType(2)),
				], tb.getTempHeapType(3)),
			);
		});

		test.test('multiple entries.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut x: int = 1;
				(a= (a= x, b= (a= 2.0, b= 3)), b= (a= 4.0, b= (a= 5, b= 6.0)), c= (b= 7, a= true));
			}`);
			return assertEqualBins(
				(stmts[1] as AST.ASTNodeStatementExpression).expr!.build(),
				mod.struct.new([
					mod.struct.new([
						mod.local.get(0, binaryen.v128),
						mod.struct.new([buildConst(goal.builder, 2.0), buildConst(goal.builder, 3n)], tb.getTempHeapType(0)),
					], tb.getTempHeapType(1)),
					mod.struct.new([
						buildConst(goal.builder, 4.0),
						mod.struct.new([buildConst(goal.builder, 5n), buildConst(goal.builder, 6.0)], tb.getTempHeapType(2)),
					], tb.getTempHeapType(3)),
					mod.block(null, [
						mod.local.set(1, buildConst(goal.builder, 7n)),
						mod.local.set(2, buildConst(goal.builder, true)),
						mod.struct.new([mod.local.get(2, binaryen.v128), mod.local.get(1, binaryen.v128)], tb.getTempHeapType(4)),
					], tb.getTempHeapType(4)),
				], tb.getTempHeapType(5)),
			);
		});

		test.test('pointer entries.', () => {
			const {goal, stmts, mod, tb} = setupScript(`{
				val mut inner_ab: (a: float, b: int)   = (a= 2.0, b= 3);
				val mut inner_bb: (a: int,   b: float) = (a= 5,   b= 6.0);
				val mut inner_c:  (b: int,   a: bool)  = (b= 7,   a= true);

				val mut inner_a: (a: int,   b: (a: float, b: int))   = (a= 1,   b= inner_ab);
				val mut inner_b: (a: float, b: (a: int,   b: float)) = (a= 4.0, b= inner_bb);

				val record: (
					a: (a: int,   b: (a: float, b: int)),
					b: (a: float, b: (a: int,   b: float)),
					c: (b: int,   a: bool),
				) = (a= inner_a, b= inner_b, c= inner_c);
			}`);
			return assertEqualBins(
				stmts.map((stmt) => (stmt as AST.ASTNodeDeclarationVariable).assigned!.build()),
				[
					mod.struct.new([buildConst(goal.builder, 2.0), buildConst(goal.builder, 3n)],  tb.getTempHeapType(0)),
					mod.struct.new([buildConst(goal.builder, 5n),  buildConst(goal.builder, 6.0)], tb.getTempHeapType(1)),
					mod.block(null, [
						mod.local.set(2, buildConst(goal.builder, 7n)),
						mod.local.set(3, buildConst(goal.builder, true)),
						mod.struct.new([mod.local.get(3, binaryen.v128), mod.local.get(2, binaryen.v128)], tb.getTempHeapType(2)),
					], tb.getTempHeapType(2)),

					mod.struct.new([buildConst(goal.builder, 1n),  mod.local.get(0, tb.getTempHeapType(0))], tb.getTempHeapType(3)),
					mod.struct.new([buildConst(goal.builder, 4.0), mod.local.get(1, tb.getTempHeapType(1))], tb.getTempHeapType(4)),

					mod.struct.new([
						mod.local.get(5, tb.getTempHeapType(3)),
						mod.local.get(6, tb.getTempHeapType(4)),
						mod.local.get(4, tb.getTempHeapType(2)),
					], tb.getTempHeapType(5)),
				],
			);
		});
	});


	test.suite('<VALUE.Value>', () => {
		let builder: Builder; // eslint-disable-line @typescript-eslint/init-declarations

		test.beforeEach(() => {
			builder = new Builder();
		});

		test.test('returns `(struct.new)`.', () => {
			assertEqualBins(
				new VALUE.Record(new Map<bigint, VALUE.Value>([
					[0x100n, VALUE.INT_1],
					[0x101n, new VALUE.Float(2.0)],
				])).build(builder),
				builder.module.struct.new([buildConst(builder, 1n), buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
			);
		});

		test.test('if keys are out of order, returns a `(block)` with `(set)`s followed by a `(struct.new)` with `(get)`s.', () => {
			assertEqualBins(
				new VALUE.Record(new Map<bigint, VALUE.Value>([
					[0x101n, new VALUE.Float(2.0)],
					[0x100n, VALUE.INT_1],
				])).build(builder),
				builder.module.block(null, [
					builder.module.local.set(0, buildConst(builder, 2.0)),
					builder.module.local.set(1, buildConst(builder, 1n)),
					builder.module.struct.new([
						builder.module.local.get(1, binaryen.v128),
						builder.module.local.get(0, binaryen.v128),
					], builder.typeBuilder.getTempHeapType(0)),
				], builder.typeBuilder.getTempHeapType(0)),
			);
		});

		test.test('boxed record with many props.', () => {
			assertEqualBins(
				new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Record(new Map<bigint, VALUE.Value>([
					[0x100n, VALUE.INT_1],
					[0x101n, new VALUE.Float(2.0)],
					[0x102n, VALUE.TRUE],
				]))]])).build(builder),
				builder.module.struct.new([builder.module.struct.new([
					buildConst(builder, 1n),
					buildConst(builder, 2.0),
					buildConst(builder, true),
				], builder.typeBuilder.getTempHeapType(0))], builder.typeBuilder.getTempHeapType(1)),
			);
		});

		test.test('nested records.', () => {
			assertEqualBins(
				new VALUE.Record(new Map<bigint, VALUE.Value>([
					[0x100n, VALUE.INT_1],
					[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Float(2.0)]]))],
					[0x102n, new VALUE.Record(new Map<bigint, VALUE.Value>([
						[0x100n, new VALUE.Integer(3n)],
						[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([[0x100n, new VALUE.Float(4.0)]]))],
					]))],
				])).build(builder),
				builder.module.struct.new([
					buildConst(builder, 1n),
					builder.module.struct.new([buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
					builder.module.struct.new([
						buildConst(builder, 3n),
						builder.module.struct.new([buildConst(builder, 4.0)], builder.typeBuilder.getTempHeapType(1)),
					], builder.typeBuilder.getTempHeapType(2)),
				], builder.typeBuilder.getTempHeapType(3)),
			);
		});

		test.test('multiple entries.', () => {
			assertEqualBins(
				new VALUE.Record(new Map<bigint, VALUE.Value>([
					[0x100n, new VALUE.Record(new Map<bigint, VALUE.Value>([
						[0x100n, VALUE.INT_1],
						[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x100n, new VALUE.Float(2.0)],
							[0x101n, new VALUE.Integer(3n)],
						]))],
					]))],
					[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([
						[0x100n, new VALUE.Float(4.0)],
						[0x101n, new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x100n, new VALUE.Integer(5n)],
							[0x101n, new VALUE.Float(6.0)],
						]))],
					]))],
					[0x102n, new VALUE.Record(new Map<bigint, VALUE.Value>([
						[0x101n, new VALUE.Integer(7n)],
						[0x100n, VALUE.TRUE],
					]))],
				])).build(builder),
				builder.module.struct.new([
					builder.module.struct.new([
						buildConst(builder, 1n),
						builder.module.struct.new([buildConst(builder, 2.0), buildConst(builder, 3n)], builder.typeBuilder.getTempHeapType(0)),
					], builder.typeBuilder.getTempHeapType(1)),
					builder.module.struct.new([
						buildConst(builder, 4.0),
						builder.module.struct.new([buildConst(builder, 5n), buildConst(builder, 6.0)], builder.typeBuilder.getTempHeapType(2)),
					], builder.typeBuilder.getTempHeapType(3)),
					builder.module.block(null, [
						builder.module.local.set(0, buildConst(builder, 7n)),
						builder.module.local.set(1, buildConst(builder, true)),
						builder.module.struct.new([builder.module.local.get(1, binaryen.v128), builder.module.local.get(0, binaryen.v128)], builder.typeBuilder.getTempHeapType(4)),
					], builder.typeBuilder.getTempHeapType(4)),
				], builder.typeBuilder.getTempHeapType(5)),
			);
		});
	});
});
