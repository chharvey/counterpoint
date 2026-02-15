import binaryen from 'binaryen';
import {
	AST,
	VALUE,
	Builder,
} from '../../src/index.ts';
import type {BinaryenModuleUpdates} from '../../src/builder/-types.d.ts';
import {assertEqualBins} from '../assert-helpers.ts';
import {buildConst} from '../helpers.ts';



export function setup(src: string): { // TODO: use `setupScript`
	readonly builder: Builder,
	readonly expr:    binaryen.ExpressionRef,
} {
	const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
	goal.varCheck();
	goal.typeCheck();
	goal.build();
	return {
		builder: goal.builder,
		expr:    (goal.children.at(-1) as AST.ASTNodeStatementExpression).expr!.build(),
	} as const;
}



describe('build_tuple_like', () => {
	describe('<AST.ASTNodeExpression>', () => {
		it('returns `(struct.new)`.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				(x, 2.0);
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new([builder.module.local.get(0, binaryen.v128), buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
			);
		});

		it('empty tuple returns `(struct.new_default)`.', () => {
			const {builder, expr} = setup(`
				();
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new_default(builder.typeBuilder.getTempHeapType(0)),
			);
		});

		it('boxed tuple with many items.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				((x, 2.0, true),);
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new([builder.module.struct.new([
					builder.module.local.get(0, binaryen.v128),
					buildConst(builder, 2.0),
					buildConst(builder, true),
				], builder.typeBuilder.getTempHeapType(0))], builder.typeBuilder.getTempHeapType(1)),
			);
		});

		it('nested tuples.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				(x, (2.0,), (3, (4.0,)));
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new([
					builder.module.local.get(0, binaryen.v128),
					builder.module.struct.new([buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
					builder.module.struct.new([
						buildConst(builder, 3n),
						builder.module.struct.new([buildConst(builder, 4.0)], builder.typeBuilder.getTempHeapType(1)),
					], builder.typeBuilder.getTempHeapType(2)),
				], builder.typeBuilder.getTempHeapType(3)),
			);
		});

		it('multiple entries.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				((x, (2.0, 3)), (4.0, (5, 6.0)), (7, ()));
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new([
					builder.module.struct.new([
						builder.module.local.get(0, binaryen.v128),
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

		it('pointer entries.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut inner01: (float, int)   = (2.0, 3);
				val mut inner11: (int,   float) = (5,   6.0);
				val mut inner2:  (int,   ())    = (7,   ());

				val mut inner0: (int,   (float, int))   = (1,   inner01);
				val mut inner1: (float, (int,   float)) = (4.0, inner11);

				val tuple: ((int, (float, int)), (float, (int, float)), (int, ())) = (inner0, inner1, inner2);
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.build();

			const bldr: Builder               = goal.builder;
			const mod:  BinaryenModuleUpdates = bldr.module;
			return assertEqualBins(
				(goal.children as AST.ASTNodeDeclarationVariable[]).map((stmt) => stmt.assigned!.build()),
				[
					mod.struct.new([buildConst(bldr, 2.0), buildConst(bldr, 3n)],  bldr.typeBuilder.getTempHeapType(0)),
					mod.struct.new([buildConst(bldr, 5n),  buildConst(bldr, 6.0)], bldr.typeBuilder.getTempHeapType(1)),
					mod.struct.new([
						buildConst(bldr, 7n),
						mod.struct.new_default(bldr.typeBuilder.getTempHeapType(2)),
					], bldr.typeBuilder.getTempHeapType(3)),

					mod.struct.new([buildConst(bldr, 1n),  mod.local.get(0, bldr.typeBuilder.getTempHeapType(0))], bldr.typeBuilder.getTempHeapType(4)),
					mod.struct.new([buildConst(bldr, 4.0), mod.local.get(1, bldr.typeBuilder.getTempHeapType(1))], bldr.typeBuilder.getTempHeapType(5)),

					mod.struct.new([
						mod.local.get(3, bldr.typeBuilder.getTempHeapType(4)),
						mod.local.get(4, bldr.typeBuilder.getTempHeapType(5)),
						mod.local.get(2, bldr.typeBuilder.getTempHeapType(3)),
					], bldr.typeBuilder.getTempHeapType(6)),
				],
			);
		});
	});


	describe('<VALUE.Value>', () => {
		let builder: Builder = new Builder();

		beforeEach(() => {
			builder = new Builder();
		});

		it('returns `(struct.new)`.', () => {
			assertEqualBins(
				new VALUE.Tuple([VALUE.INT_1, new VALUE.Float(2.0)]).build(builder),
				builder.module.struct.new([buildConst(builder, 1n), buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
			);
		});

		it('empty tuple returns `(struct.new_default)`.', () => {
			assertEqualBins(
				new VALUE.Tuple().build(builder),
				builder.module.struct.new_default(builder.typeBuilder.getTempHeapType(0)),
			);
		});

		it('boxed tuple with many items.', () => {
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

		it('nested tuples.', () => {
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

		it('multiple entries.', () => {
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



describe('build_record_like', () => {
	describe('<AST.ASTNodeExpression>', () => {
		it('returns `(struct.new)`.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				(a= x, b= 2.0);
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new([builder.module.local.get(0, binaryen.v128), buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
			);
		});

		it('if source order differs from key order, returns a `(block)` with `(set)`s followed by a `(struct.new)` with `(get)`s.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				(a= x, b= 2.0); % establishes key order
				(b= 2.0, a= x);
			`);
			return assertEqualBins(
				expr,
				builder.module.block(null, [
					builder.module.local.set(1, buildConst(builder, 2.0)),
					builder.module.local.set(2, builder.module.local.get(0, binaryen.v128)),
					builder.module.struct.new([builder.module.local.get(2, binaryen.v128), builder.module.local.get(1, binaryen.v128)], builder.typeBuilder.getTempHeapType(0)),
				], builder.typeBuilder.getTempHeapType(0)),
			);
		});

		it('boxed record with many props.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				(a= (a= x, b= 2.0, c= true));
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new([builder.module.struct.new([
					builder.module.local.get(0, binaryen.v128),
					buildConst(builder, 2.0),
					buildConst(builder, true),
				], builder.typeBuilder.getTempHeapType(0))], builder.typeBuilder.getTempHeapType(1)),
			);
		});

		it('nested records.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				(a= x, b= (a= 2.0), c= (a= 3, b= (a= 4.0)));
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new([
					builder.module.local.get(0, binaryen.v128),
					builder.module.struct.new([buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
					builder.module.struct.new([
						buildConst(builder, 3n),
						builder.module.struct.new([buildConst(builder, 4.0)], builder.typeBuilder.getTempHeapType(1)),
					], builder.typeBuilder.getTempHeapType(2)),
				], builder.typeBuilder.getTempHeapType(3)),
			);
		});

		it('multiple entries.', () => {
			const {builder, expr} = setup(`
				val mut x: int = 1;
				(a= (a= x, b= (a= 2.0, b= 3)), b= (a= 4.0, b= (a= 5, b= 6.0)), c= (b= 7, a= true));
			`);
			return assertEqualBins(
				expr,
				builder.module.struct.new([
					builder.module.struct.new([
						builder.module.local.get(0, binaryen.v128),
						builder.module.struct.new([buildConst(builder, 2.0), buildConst(builder, 3n)], builder.typeBuilder.getTempHeapType(0)),
					], builder.typeBuilder.getTempHeapType(1)),
					builder.module.struct.new([
						buildConst(builder, 4.0),
						builder.module.struct.new([buildConst(builder, 5n), buildConst(builder, 6.0)], builder.typeBuilder.getTempHeapType(2)),
					], builder.typeBuilder.getTempHeapType(3)),
					builder.module.block(null, [
						builder.module.local.set(1, buildConst(builder, 7n)),
						builder.module.local.set(2, buildConst(builder, true)),
						builder.module.struct.new([builder.module.local.get(2, binaryen.v128), builder.module.local.get(1, binaryen.v128)], builder.typeBuilder.getTempHeapType(4)),
					], builder.typeBuilder.getTempHeapType(4)),
				], builder.typeBuilder.getTempHeapType(5)),
			);
		});

		it('pointer entries.', () => {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
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
			`);
			goal.varCheck();
			goal.typeCheck();
			goal.build();

			const bldr: Builder               = goal.builder;
			const mod:  BinaryenModuleUpdates = bldr.module;
			return assertEqualBins(
				(goal.children as AST.ASTNodeDeclarationVariable[]).map((stmt) => stmt.assigned!.build()),
				[
					mod.struct.new([buildConst(bldr, 2.0), buildConst(bldr, 3n)],  bldr.typeBuilder.getTempHeapType(0)),
					mod.struct.new([buildConst(bldr, 5n),  buildConst(bldr, 6.0)], bldr.typeBuilder.getTempHeapType(1)),
					mod.block(null, [
						mod.local.set(2, buildConst(bldr, 7n)),
						mod.local.set(3, buildConst(bldr, true)),
						mod.struct.new([mod.local.get(3, binaryen.v128), mod.local.get(2, binaryen.v128)], bldr.typeBuilder.getTempHeapType(2)),
					], bldr.typeBuilder.getTempHeapType(2)),

					mod.struct.new([buildConst(bldr, 1n),  mod.local.get(0, bldr.typeBuilder.getTempHeapType(0))], bldr.typeBuilder.getTempHeapType(3)),
					mod.struct.new([buildConst(bldr, 4.0), mod.local.get(1, bldr.typeBuilder.getTempHeapType(1))], bldr.typeBuilder.getTempHeapType(4)),

					mod.struct.new([
						mod.local.get(5, bldr.typeBuilder.getTempHeapType(3)),
						mod.local.get(6, bldr.typeBuilder.getTempHeapType(4)),
						mod.local.get(4, bldr.typeBuilder.getTempHeapType(2)),
					], bldr.typeBuilder.getTempHeapType(5)),
				],
			);
		});
	});


	describe('<VALUE.Value>', () => {
		let builder: Builder = new Builder();

		beforeEach(() => {
			builder = new Builder();
		});

		it('returns `(struct.new)`.', () => {
			assertEqualBins(
				new VALUE.Record(new Map<bigint, VALUE.Value>([
					[0x100n, VALUE.INT_1],
					[0x101n, new VALUE.Float(2.0)],
				])).build(builder),
				builder.module.struct.new([buildConst(builder, 1n), buildConst(builder, 2.0)], builder.typeBuilder.getTempHeapType(0)),
			);
		});

		it('boxed record with many props.', () => {
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

		it('nested records.', () => {
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

		it('multiple entries.', () => {
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
