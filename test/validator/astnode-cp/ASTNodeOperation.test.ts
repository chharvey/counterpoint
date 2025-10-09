import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	type Builder,
	BinVect,
	TypeErrorInvalidOperation,
	NanErrorInvalid,
	NanErrorDivZero,
} from '../../../src/index.ts';
import {
	assertEqualTypes,
	assertEqualBins,
} from '../../assert-helpers.ts';
import {
	CONFIG_FOLDING_OFF,
	setupScript,
	typeUnit,
	buildConst,
} from '../../helpers.ts';
import {extract_lines} from '../../utils.ts';



function typeOperations(tests: ReadonlyMap<string, VALUE.Primitive>, config: CPConfig = CONFIG_DEFAULT): void {
	return assertEqualTypes(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).type()),
		[...tests.values()].map((expected) => new TYPE.Unit(expected)),
	);
}
function foldOperations(tests: Map<string, VALUE.Value>, config: CPConfig = CONFIG_DEFAULT): void {
	return assert.deepStrictEqual(
		[...tests.keys()].map((src) => AST.ASTNodeOperation.fromSource(src, config).fold()),
		[...tests.values()],
	);
}
function buildOperations(tests: ReadonlyMap<string, (builder: Builder) => binaryen.ExpressionRef>, config: CPConfig = CONFIG_FOLDING_OFF): void {
	return xjs.Map.forEachAggregated(tests, (expected_fn, src) => {
		const operation: AST.ASTNodeOperation = AST.ASTNodeOperation.fromSource(src, config);
		return assertEqualBins(
			operation.build(),
			expected_fn.call(null, operation.builder),
		);
	});
}
function typeOfOperationFromSource(src: string): TYPE.Type {
	return AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).type();
}



describe('ASTNodeOperation', () => {
	function typeOfStmtExpr(stmt: AST.ASTNodeStatement): TYPE.Type {
		assert_instanceof(stmt, AST.ASTNodeStatementExpression);
		return stmt.expr!.type();
	}

	const CALL = {
		vnot: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vnot', [arg], binaryen.v128),
		vemp: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vemp', [arg], binaryen.v128),
		vneg: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vneg', [arg], binaryen.v128),
		vtoi: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtoi', [arg], binaryen.v128),
		vtof: (mod: binaryen.Module, arg: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vtof', [arg], binaryen.v128),

		vexp: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vexp', [arg0, arg1], binaryen.v128),
		vmul: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vmul', [arg0, arg1], binaryen.v128),
		vdiv: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vdiv', [arg0, arg1], binaryen.v128),
		vadd: (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vadd', [arg0, arg1], binaryen.v128),
		vlt:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vlt',  [arg0, arg1], binaryen.v128),
		vgt:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vgt',  [arg0, arg1], binaryen.v128),
		vle:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vle',  [arg0, arg1], binaryen.v128),
		vge:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vge',  [arg0, arg1], binaryen.v128),
		vid:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('vid',  [arg0, arg1], binaryen.v128),
		veq:  (mod: binaryen.Module, arg0: binaryen.ExpressionRef, arg1: binaryen.ExpressionRef): binaryen.ExpressionRef => mod.call('veq',  [arg0, arg1], binaryen.v128),
	} as const;

	/**
	 * Return a block containing `(drop)` expressions for each of `args`, followed by a second expression.
	 * If `final` is provided as an ExpressionRef, it is the second expression;
	 * otherwise, a BinVect of boolean value is the second expression.
	 */
	function drop_then(mod: binaryen.Module, args: readonly binaryen.ExpressionRef[], final: binaryen.ExpressionRef | boolean): binaryen.ExpressionRef {
		return mod.block(null, [
			...args.map((arg) => mod.drop(arg)),
			typeof final === 'number' ? final : new BinVect(mod, final).vect,
		], binaryen.v128);
	}




	describe('#type', () => {
		it('returns `nothing` for NanErrors.', () => {
			[
				AST.ASTNodeOperationBinaryArithmetic.fromSource('-4.0 ^ -0.5').type(),
				AST.ASTNodeOperationBinaryArithmetic.fromSource('1.5 / 0.0').type(),
			].forEach((typ) => {
				assert.ok(typ.isBottomType);
			});
		});
	});



	describe('#build', () => {
		it('compound expression.', () => {
			buildOperations(new Map([
				['42 ^ 2 * 420', (builder) => CALL.vmul(
					builder.module,
					CALL.vexp(builder.module, buildConst(builder, 42n), buildConst(builder, 2n)),
					buildConst(builder, 420n),
				)],
				['2 * 3.0 + 5', (builder) => CALL.vadd(
					builder.module,
					CALL.vmul(builder.module, buildConst(builder, 2n), buildConst(builder, 3.0)),
					buildConst(builder, 5n),
				)],
			]));
		});
	});



	describe('ASTNodeOperationUnary', () => {
		describe('#type', () => {
			context('with constant folding on.', () => {
				it('returns a constant Boolean type for boolean unary operation of anything.', () => {
					typeOperations(new Map<string, VALUE.Boolean>([
						['!null',   VALUE.TRUE],
						['!false',  VALUE.TRUE],
						['!true',   VALUE.FALSE],
						['!@hello', VALUE.FALSE],
						['!42',     VALUE.FALSE],
						['!4.2e+1', VALUE.FALSE],
						['?null',   VALUE.TRUE],
						['?false',  VALUE.TRUE],
						['?true',   VALUE.FALSE],
						['?@hello', VALUE.FALSE],
						['?42',     VALUE.FALSE],
						['?4.2e+1', VALUE.FALSE],

						['![]',         VALUE.FALSE],
						['![42]',       VALUE.FALSE],
						['![a= 42]',    VALUE.FALSE],
						['!{}',         VALUE.FALSE],
						['!{42}',       VALUE.FALSE],
						['!{41 -> 42}', VALUE.FALSE],
						['?[]',         VALUE.TRUE],
						['?[42]',       VALUE.FALSE],
						['?[a= 42]',    VALUE.FALSE],
						['?{}',         VALUE.TRUE],
						['?{42}',       VALUE.FALSE],
						['?{41 -> 42}', VALUE.FALSE],
					]));
				});
			});

			context('with constant folding off.', () => {
				describe('[operator=NOT]', () => {
					it('returns type `true` for a subtype of `null | false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							let var a: null = null;
							let var b: null | false = null;
							!a;
							!b;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(2), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.TRUE));
					});
					it('returns type `bool` for a supertype of `T narrows null | false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							let var a: null | int = null;
							let var b: null | int = 42;
							let var c: bool = false;
							let var d: bool | float = 4.2;
							!a;
							!b;
							!c;
							!d;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(4), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.BOOL));
					});
					it('returns type `false` for any type not a supertype of `null` or `false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							let var a: int = 42;
							let var b: float = 4.2;
							let var c: sym = @hello;
							!a;
							!b;
							!c;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(3), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.FALSE));
					});
					it('[literalCollection] returns type `false` for any type not a supertype of `null` or `false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							![];
							![42];
							![a= 42];
							!{41 -> 42};
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts, (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.FALSE));
					});
				});
				describe('[operator=EMP]', () => {
					it('returns type `true` for a subtype of `null | false`.', () => {
						xjs.Array.forEachAggregated(setupScript(`{
							let var a: null = null;
							let var b: null | false = null;
							?a;
							?b;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(2), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.TRUE));
					});
					it('returns type `bool` for anything else.', () => {
						[
							'?true',
							'?@hello',
							'?42',
							'?4.2e+1',

							'?[]',
							'?[42]',
							'?[a= 42]',
							'?{41 -> 42}',
						].map((src) => AST.ASTNodeOperation.fromSource(src, CONFIG_FOLDING_OFF).type()).forEach((typ) => assert.strictEqual(typ, TYPE.BOOL));
						return xjs.Array.forEachAggregated(setupScript(`{
							let var a: null | int = null;
							let var b: null | int = 42;
							let var c: bool = false;
							let var d: bool | float = 4.2;
							let var f: int = 42;
							let var g: float = 4.2;
							?a;
							?b;
							?c;
							?d;
							?f;
							?g;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(6), (stmt) => assert.strictEqual(typeOfStmtExpr(stmt), TYPE.BOOL));
					});
				});
			});
			describe('[operator=INT | FLOAT]', () => {
				it('returns the respective type for numeric operands.', () => {
					assert.deepStrictEqual(setupScript(`{
						let var my_int: int   = 7;
						let var my_flt: float = -3.5;

						int   my_int;
						int   my_flt;
						float my_int;
						float my_flt;
					}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
						TYPE.INT,
						TYPE.INT,
						TYPE.FLOAT,
						TYPE.FLOAT,
					]);
				});
				it('throws for non-numeric operands.', () => {
					xjs.Array.forEachAggregated(extract_lines`
						int   null
						int   @symb
						int   "string"
						int   ["string tuple"]
						int   [record= "string"]
						float null
						float @symb
						float "string"
						float ["string tuple"]
						float [record= "string"]
					`, (src) => assert.throws(() => AST.ASTNodeOperationUnary.fromSource(src).type(), TypeErrorInvalidOperation));
				});
			});
		});


		describe('#fold', () => {
			specify('[operator=NOT]', () => {
				foldOperations(new Map([
					['!false',               VALUE.TRUE],
					['!true',                VALUE.FALSE],
					['!null',                VALUE.TRUE],
					['!0',                   VALUE.FALSE],
					['!42',                  VALUE.FALSE],
					['!0.0',                 VALUE.FALSE],
					['!-0.0',                VALUE.FALSE],
					['!4.2e+1',              VALUE.FALSE],
					['!""',                  VALUE.FALSE],
					['!"hello"',             VALUE.FALSE],
					['![]',                  VALUE.FALSE],
					['![42]',                VALUE.FALSE],
					['![a= 42]',             VALUE.FALSE],
					['!List.<int>([])',      VALUE.FALSE],
					['!List.<int>([42])',    VALUE.FALSE],
					['!Dict.<int>([a= 42])', VALUE.FALSE],
					['!{}',                  VALUE.FALSE],
					['!{42}',                VALUE.FALSE],
					['!{41 -> 42}',          VALUE.FALSE],
				]));
			});
			specify('[operator=EMP]', () => {
				foldOperations(new Map([
					['?false',               VALUE.TRUE],
					['?true',                VALUE.FALSE],
					['?null',                VALUE.TRUE],
					['?0',                   VALUE.TRUE],
					['?42',                  VALUE.FALSE],
					['?0.0',                 VALUE.TRUE],
					['?-0.0',                VALUE.TRUE],
					['?4.2e+1',              VALUE.FALSE],
					['?""',                  VALUE.TRUE],
					['?"hello"',             VALUE.FALSE],
					['?[]',                  VALUE.TRUE],
					['?[42]',                VALUE.FALSE],
					['?[a= 42]',             VALUE.FALSE],
					['?List.<int>([])',      VALUE.TRUE],
					['?List.<int>([42])',    VALUE.FALSE],
					['?Dict.<int>([a= 42])', VALUE.FALSE],
					['?{}',                  VALUE.TRUE],
					['?{42}',                VALUE.FALSE],
					['?{41 -> 42}',          VALUE.FALSE],
				]));
			});
			it('[operator=INT | FLOAT]: returns a numeric conversion only if needed.', () => {
				const exprs: readonly AST.ASTNodeOperationUnary[] = setupScript(`{
					let my_int: int   = 7;
					let my_flt: float = -3.5;

					int   my_int;
					int   my_flt;
					float my_int;
					float my_flt;
				}`, null, {build: false}).stmts.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary);
				const values:   readonly (VALUE.Value | null)[] = exprs.map((expr) => expr.fold());
				const operands: readonly (VALUE.Value | null)[] = exprs.map((expr) => expr.operand.fold());
				assert.strictEqual(values[0], operands[0]);
				assert.strictEqual(values[3], operands[3]);
				return assert.deepStrictEqual(values, [
					new VALUE.Integer(7n),
					new VALUE.Integer(-3n),
					new VALUE.Float(7.0),
					new VALUE.Float(-3.5),
				]);
			});
		});


		describe('#build', () => {
			it('optimizes by evaluating operand type.', () => {
				buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
					['!null',   (builder) => drop_then(builder.module, [buildConst(builder)],                true)],
					['!false',  (builder) => drop_then(builder.module, [buildConst(builder, false)],         true)],
					['!true',   (builder) => drop_then(builder.module, [buildConst(builder, true)],          false)],
					['!@hello', (builder) => drop_then(builder.module, [buildConst(builder, Symbol(0x100))], false)],
					['!42',     (builder) => drop_then(builder.module, [buildConst(builder, 42n)],           false)],
					['!4.2',    (builder) => drop_then(builder.module, [buildConst(builder, 4.2)],           false)],
					['?null',   (builder) => drop_then(builder.module, [buildConst(builder)],                true)],
					['?false',  (builder) => drop_then(builder.module, [buildConst(builder, false)],         true)],
				]));
				// eslint-disable-next-line no-constant-binary-expression, @typescript-eslint/no-unnecessary-condition
				false && buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
					['![]',    (builder) => drop_then(builder.module, [new VALUE.Tuple().build(builder)], false)],
					['![4.2]', (builder) => drop_then(builder.module, [new VALUE.Tuple([new VALUE.Float(4.2)]).build(builder)], false)],
				]));
			});
			it('returns the correct operation.', () => {
				buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
					['?true',  (builder) => CALL.vemp(builder.module, buildConst(builder, true))],
					['?@hi',   (builder) => CALL.vemp(builder.module, buildConst(builder, Symbol(0x100)))],
					['?42',    (builder) => CALL.vemp(builder.module, buildConst(builder, 42n))],
					['?4.2',   (builder) => CALL.vemp(builder.module, buildConst(builder, 4.2))],
					['?0',     (builder) => CALL.vemp(builder.module, buildConst(builder, 0n))],
					['?0.0',   (builder) => CALL.vemp(builder.module, buildConst(builder, 0.0))],
					['-(4)',   (builder) => CALL.vneg(builder.module, buildConst(builder, 4n))],
					['-(4.2)', (builder) => CALL.vneg(builder.module, buildConst(builder, 4.2))],
				]));
				// eslint-disable-next-line no-constant-binary-expression, @typescript-eslint/no-unnecessary-condition
				false && buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
					['?[]',    (builder) => CALL.vemp(builder.module, new VALUE.Tuple().build(builder))],
					['?[4.2]', (builder) => CALL.vemp(builder.module, new VALUE.Tuple([new VALUE.Float(4.2)]).build(builder))],
				]));
				const {stmts, mod} = setupScript(`{
					let var f: bool = false;
					let var t: bool = true;
					!f;
					!t;
					?f;
					?t;
				}`);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.build()),
					[
						CALL.vnot(mod, mod.local.get(0, binaryen.v128)),
						CALL.vnot(mod, mod.local.get(1, binaryen.v128)),
						CALL.vemp(mod, mod.local.get(0, binaryen.v128)),
						CALL.vemp(mod, mod.local.get(1, binaryen.v128)),
					],
				);
			});
			it('works with vects.', () => {
				const {stmts, mod} = setupScript(`{
					let var x: int | float = 42;
					let var y: int | float = 4.2;

					!x;
					!y;

					?x;
					?y;

					-x;
					-y;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = stmts.slice(2).map((stmt) => (
					((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand.build()
				));
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						drop_then(mod, [extracts[0]], false),
						drop_then(mod, [extracts[1]], false),
						CALL.vemp(mod, extracts[2]),
						CALL.vemp(mod, extracts[3]),
						CALL.vneg(mod, extracts[4]),
						CALL.vneg(mod, extracts[5]),
					].map((expected) => mod.drop(expected)),
				);
			});
			it('multiple operations.', () => {
				const {stmts, mod} = setupScript(`{
					let var x: int | float = 42;
					let var y: int | float = 4.2;

					!!x;
					??y;

					!-x;
					?-y;

					--x;
					--y;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = stmts.slice(2).map((stmt) => (
					(((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand as AST.ASTNodeOperationUnary).operand.build()
				));
				assertEqualBins(
					stmts.slice(4).map((stmt) => (
						((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand.build()
					)),
					extracts.slice(2).map((extract) => CALL.vneg(mod, extract)),
				);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						drop_then(mod, [drop_then(mod, [extracts[0]], false)], true),
						CALL.vemp(mod, CALL.vemp(mod, extracts[1])),
						drop_then(mod, [CALL.vneg(mod, extracts[2])], false),
						CALL.vemp(mod, CALL.vneg(mod, extracts[3])),
						CALL.vneg(mod, CALL.vneg(mod, extracts[4])),
						CALL.vneg(mod, CALL.vneg(mod, extracts[5])),
					].map((expected) => mod.drop(expected)),
				);
			});
			it('[operator=INT | FLOAT]: returns a numeric conversion.', () => {
				const {stmts, mod} = setupScript(`{
					let var my_int: int   = 7;
					let var my_flt: float = -3.5;

					int   my_int;
					int   my_flt;
					float my_int;
					float my_flt;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = stmts.slice(2).map((stmt) => (
					((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationUnary).operand.build()
				));
				return assertEqualBins(stmts.slice(2).map((stmt) => stmt.build()), [
					mod.drop(CALL.vtoi(mod, extracts[0])),
					mod.drop(CALL.vtoi(mod, extracts[1])),
					mod.drop(CALL.vtof(mod, extracts[2])),
					mod.drop(CALL.vtof(mod, extracts[3])),
				]);
			});
		});
	});



	describe('ASTNodeOperationBinary', () => {
		describe('#build', () => {
			it('works with vects.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let var x: int   = 42;
					let var y: float = 4.2;

					x * 2;
					y * 2.4;

					x < 2;
					y < 2.4;

					x == 2;
					y == 2;
					x == 2.4;
					y == 2.4;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = stmts.slice(2).map((stmt) => (
					((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0.build()
				));
				/* eslint-disable @stylistic/quote-props */
				const const_ = {
					'2':   buildConst(goal.builder, 2n),
					'2.4': buildConst(goal.builder, 2.4),
				} as const;
				/* eslint-enable @stylistic/quote-props */
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						CALL.vmul(mod, extracts[0], const_['2']),
						CALL.vmul(mod, extracts[1], const_['2.4']),

						CALL.vlt(mod, extracts[2], const_['2']),
						CALL.vlt(mod, extracts[3], const_['2.4']),

						CALL.veq(mod, extracts[4], const_['2']),
						CALL.veq(mod, extracts[5], const_['2']),
						CALL.veq(mod, extracts[6], const_['2.4']),
						CALL.veq(mod, extracts[7], const_['2.4']),
					].map((expected) => mod.drop(expected)),
				);
			});
			it('multiple unions.', () => {
				const {stmts, mod} = setupScript(`{
					let var x: int | float = 42;
					let var y: int | float = 4.2;
					x == y;
				}`);
				const extracts: readonly (readonly binaryen.ExpressionRef[])[] = stmts.slice(2).map((stmt) => {
					const binexp = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary;
					return [
						binexp.operand0.build(),
						binexp.operand1.build(),
					];
				});
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						CALL.veq(mod, extracts[0][0], extracts[0][1]),
					].map((expected) => mod.drop(expected)),
				);
			});
			it('multiple operations.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let var x: int   = 42;
					let var y: float = 4.2;
					x + 2 + 3;
					2.0 + y + 3.0;
				}`);
				const extracts: readonly binaryen.ExpressionRef[] = [
					(((stmts[2] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0 as AST.ASTNodeOperationBinary).operand0.build(),
					(((stmts[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0 as AST.ASTNodeOperationBinary).operand1.build(),
				];
				const const_ = {
					'2':   buildConst(goal.builder, 2n),
					'3':   buildConst(goal.builder, 3n),
					'2.0': buildConst(goal.builder, 2.0),
					'3.0': buildConst(goal.builder, 3.0),
				} as const;
				const inners: readonly binaryen.ExpressionRef[] = [
					CALL.vadd(mod, extracts[0], const_['2']),
					CALL.vadd(mod, const_['2.0'], extracts[1]),
				];
				assertEqualBins(
					stmts.slice(2).map((stmt) => (
						((stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary).operand0.build()
					)),
					inners,
				);
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					inners.map((inner, i) => mod.drop(CALL.vadd(mod, inner, [const_['3'], const_['3.0']][i]))),
				);
			});
		});
	});



	describe('ASTNodeOperationBinaryArithmetic', () => {
		describe('#type', () => {
			context('with constant folding on.', () => {
				it('returns a constant Integer type for any operation of integers.', () => {
					assertEqualTypes(AST.ASTNodeOperationBinaryArithmetic.fromSource('7 * 3 * 2').type(), typeUnit(7n * 3n * 2n));
				});
				it('returns a constant Float type for any operation of floats.', () => {
					assertEqualTypes(AST.ASTNodeOperationBinaryArithmetic.fromSource('7.1 * 3.1 * 2.1').type(), typeUnit(7.1 * 3.1 * 2.1));
				});
				it('throws for any operation of mix of integers and floats.', () => {
					assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource('3 * 2.7')     .type(), TypeErrorInvalidOperation);
					assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource('7 * 3.0 * 2') .type(), TypeErrorInvalidOperation);
				});
			});
			context('with constant folding off.', () => {
				it('returns Integer for integer arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource('(7 + 3) * 2', CONFIG_FOLDING_OFF);
					assert.strictEqual(node.type(), TYPE.INT);
					assertEqualTypes(
						[node.operand0.type(), node.operand1.type()],
						[TYPE.INT,             typeUnit(2n)],
					);
				});
				it('returns Float for float arithmetic.', () => {
					const node: AST.ASTNodeOperationBinaryArithmetic = AST.ASTNodeOperationBinaryArithmetic.fromSource('7.1 * 3.1 ^ 2.1', CONFIG_FOLDING_OFF);
					assert.strictEqual(node.type(), TYPE.FLOAT);
					assertEqualTypes(
						[node.operand0.type(), node.operand1.type()],
						[typeUnit(7.1),        TYPE.FLOAT],
					);
				});
				it('throws for any operation of mix of integers and floats.', () => {
					assert.throws(() => typeOfOperationFromSource('7.0 + 3'), TypeErrorInvalidOperation);
				});
			});
			it('throws for arithmetic operation of non-numbers.', () => {
				[
					'null + 5',
					'5 * null',
					'false - 2',
					'2 / true',
					'null ^ false',
					'"hello" + 5',
				].forEach((src) => {
					assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).type(), TypeErrorInvalidOperation);
				});
			});
		});


		describe('#fold', () => {
			it('computes the value of an integer operation of constants.', () => {
				foldOperations(new Map([
					['42 + 420',        new VALUE.Integer(42n + 420n)],
					['42 - 420',        new VALUE.Integer(42n + -420n)],
					[' 126 /  3',       new VALUE.Integer( 126n /  3n)],
					['-126 /  3',       new VALUE.Integer(-126n /  3n)],
					[' 126 / -3',       new VALUE.Integer( 126n / -3n)],
					['-126 / -3',       new VALUE.Integer(-126n / -3n)],
					[' 200 /  3',       new VALUE.Integer( 200n /  3n)],
					[' 200 / -3',       new VALUE.Integer( 200n / -3n)],
					['-200 /  3',       new VALUE.Integer(-200n /  3n)],
					['-200 / -3',       new VALUE.Integer(-200n / -3n)],
					['-(5) ^ +(2 * 3)', new VALUE.Integer((-5n) ** (2n * 3n))],
				]));
			});
			it('overflows integers properly.', () => {
				assert.deepStrictEqual([
					'2 ^ 63 + 2 ^ 62',
					'-(2 ^ 62) - 2 ^ 63',
					'42 ^ 2 * 420',
				].map((src) => AST.ASTNodeOperationBinaryArithmetic.fromSource(src).fold()), [
					new VALUE.Integer(-(2n ** 62n)),
					new VALUE.Integer(2n ** 62n),
					new VALUE.Integer((42n ** 2n * 420n) % (2n ** 64n)),
				]);
			});
			it('computes the value of a float operation of constants.', () => {
				foldOperations(new Map<string, VALUE.Value>([
					['3.0e1 - 201.0e-1', new VALUE.Float(30 - 20.1)],
					['3.0 * 2.1',        new VALUE.Float(3.0 * 2.1)],
				]));
			});
			it('short-circuits when multiplicand is zero.', () => {
				const {stmts} = setupScript(`{
					let var i: int   = 42;
					let var f: float = 4.2;

					0 * i;    % value \`0\`
					0.0 * f;  % value \`0.0\`
					-0.0 * f; % value \`-0.0\`

					1 * i;    % non-foldable value
					1.0 * f;  % non-foldable value
					-1.0 * f; % non-foldable value
				}`);
				const exprs:     readonly AST.ASTNodeExpression[] = stmts.slice(2).map((stmt) => ((stmt as AST.ASTNodeStatementExpression).expr!));
				const expecteds: readonly (VALUE.Value | null)[]  = exprs.slice(0, 3).map((op) => (op as AST.ASTNodeOperationBinaryArithmetic).operand0.fold());
				assert.deepStrictEqual(
					exprs.map((op) => op.fold()),
					[...expecteds, null, null, null],
				);
				return assert.deepStrictEqual(
					expecteds,
					[VALUE.INT_0, VALUE.FLOAT_0, VALUE.FLOAT_N0],
				);
			});
			it('throws when performing an operation that does not yield a valid number.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource('42 / 0')     .fold(), NanErrorDivZero);
				assert.throws(() => AST.ASTNodeOperationBinaryArithmetic.fromSource('-4.0 ^ -0.5').fold(), NanErrorInvalid);
			});
		});


		specify('#build', () => {
			buildOperations(new Map([
				['42 + 420', (builder) => CALL.vadd(builder.module, buildConst(builder, 42n), buildConst(builder, 420n))],

				[' 126 /  3', (builder) => CALL.vdiv(builder.module, buildConst(builder,  126n), buildConst(builder,  3n))],
				['-126 /  3', (builder) => CALL.vdiv(builder.module, buildConst(builder, -126n), buildConst(builder,  3n))],
				[' 126 / -3', (builder) => CALL.vdiv(builder.module, buildConst(builder,  126n), buildConst(builder, -3n))],
				['-126 / -3', (builder) => CALL.vdiv(builder.module, buildConst(builder, -126n), buildConst(builder, -3n))],
				[' 200 /  3', (builder) => CALL.vdiv(builder.module, buildConst(builder,  200n), buildConst(builder,  3n))],
				[' 200 / -3', (builder) => CALL.vdiv(builder.module, buildConst(builder,  200n), buildConst(builder, -3n))],
				['-200 /  3', (builder) => CALL.vdiv(builder.module, buildConst(builder, -200n), buildConst(builder,  3n))],
				['-200 / -3', (builder) => CALL.vdiv(builder.module, buildConst(builder, -200n), buildConst(builder, -3n))],

				['42  - 420',  (builder) => CALL.vadd(builder.module, buildConst(builder, 42n), CALL.vneg(builder.module, buildConst(builder, 420n)))],
				['4.2 - 42.0', (builder) => CALL.vadd(builder.module, buildConst(builder, 4.2), CALL.vneg(builder.module, buildConst(builder, 42.0)))],
			]));
		});
	});



	describe('ASTNodeOperationBinaryComparative', () => {
		describe('#type', () => {
			it('with folding on, returns a constant value.', () => {
				typeOperations(new Map<string, VALUE.Boolean>([
					['2 <  3', VALUE.TRUE],
					['2 >  3', VALUE.FALSE],
					['2 <= 3', VALUE.TRUE],
					['2 >= 3', VALUE.FALSE],
					['2 !< 3', VALUE.FALSE],
					['2 !> 3', VALUE.TRUE],
				]));
			});
			context('with folding off.', () => {
				it('returns `Boolean` if both operands are of the same numeric type.', () => {
					assert.strictEqual(typeOfOperationFromSource('7   <  3'),   TYPE.BOOL);
					assert.strictEqual(typeOfOperationFromSource('7.0 >= 3.0'), TYPE.BOOL);
				});
				it('throws for any operation of mix of integers and floats.', () => {
					assert.throws(() => typeOfOperationFromSource('7.0 <= 3'), TypeErrorInvalidOperation);
				});
			});
			it('throws for comparative operation of non-numbers.', () => {
				assert.throws(() => AST.ASTNodeOperationBinaryComparative.fromSource('7.0 <= null').type(), TypeErrorInvalidOperation);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map([
				['3   <  3',   VALUE.FALSE],
				['3   >  3',   VALUE.FALSE],
				['3   <= 3',   VALUE.TRUE],
				['3   >= 3',   VALUE.TRUE],
				['5.2 <  7.0', VALUE.TRUE],
				['5.2 >  7.0', VALUE.FALSE],
				['5.2 <= 7.0', VALUE.TRUE],
				['5.2 >= 7.0', VALUE.FALSE],
				['5.2 <  9',   VALUE.TRUE],
				['5.2 >  9',   VALUE.FALSE],
				['5.2 <= 9',   VALUE.TRUE],
				['5.2 >= 9',   VALUE.FALSE],
				['5   <  9.2', VALUE.TRUE],
				['5   >  9.2', VALUE.FALSE],
				['5   <= 9.2', VALUE.TRUE],
				['5   >= 9.2', VALUE.FALSE],
				['3.0 <  3',   VALUE.FALSE],
				['3.0 >  3',   VALUE.FALSE],
				['3.0 <= 3',   VALUE.TRUE],
				['3.0 >= 3',   VALUE.TRUE],
				['3   <  3.0', VALUE.FALSE],
				['3   >  3.0', VALUE.FALSE],
				['3   <= 3.0', VALUE.TRUE],
				['3   >= 3.0', VALUE.TRUE],
			]));
		});


		describe('#build', () => {
			it('returns the correct operation.', () => {
				buildOperations(new Map([
					['3   <  3',   (builder) => CALL.vlt(builder.module, buildConst(builder, 3n),  buildConst(builder, 3n))],
					['3   >  3',   (builder) => CALL.vgt(builder.module, buildConst(builder, 3n),  buildConst(builder, 3n))],
					['3   <= 3',   (builder) => CALL.vle(builder.module, buildConst(builder, 3n),  buildConst(builder, 3n))],
					['3   >= 3',   (builder) => CALL.vge(builder.module, buildConst(builder, 3n),  buildConst(builder, 3n))],
					['5   <  9.2', (builder) => CALL.vlt(builder.module, buildConst(builder, 5n),  buildConst(builder, 9.2))],
					['5   >  9.2', (builder) => CALL.vgt(builder.module, buildConst(builder, 5n),  buildConst(builder, 9.2))],
					['5   <= 9.2', (builder) => CALL.vle(builder.module, buildConst(builder, 5n),  buildConst(builder, 9.2))],
					['5   >= 9.2', (builder) => CALL.vge(builder.module, buildConst(builder, 5n),  buildConst(builder, 9.2))],
					['5.2 <  3',   (builder) => CALL.vlt(builder.module, buildConst(builder, 5.2), buildConst(builder, 3n))],
					['5.2 >  3',   (builder) => CALL.vgt(builder.module, buildConst(builder, 5.2), buildConst(builder, 3n))],
					['5.2 <= 3',   (builder) => CALL.vle(builder.module, buildConst(builder, 5.2), buildConst(builder, 3n))],
					['5.2 >= 3',   (builder) => CALL.vge(builder.module, buildConst(builder, 5.2), buildConst(builder, 3n))],
					['5.2 <  9.2', (builder) => CALL.vlt(builder.module, buildConst(builder, 5.2), buildConst(builder, 9.2))],
					['5.2 >  9.2', (builder) => CALL.vgt(builder.module, buildConst(builder, 5.2), buildConst(builder, 9.2))],
					['5.2 <= 9.2', (builder) => CALL.vle(builder.module, buildConst(builder, 5.2), buildConst(builder, 9.2))],
					['5.2 >= 9.2', (builder) => CALL.vge(builder.module, buildConst(builder, 5.2), buildConst(builder, 9.2))],
				]));
			});
		});
	});



	describe('ASTNodeOperationBinaryEquality', () => {
		describe('#type', () => {
			context('with folding on.', () => {
				it('for numeric literals.', () => {
					typeOperations(new Map<string, VALUE.Boolean>([
						['0   === -0',   VALUE.TRUE],
						['0.0 === -0.0', VALUE.FALSE],
						['0   === 0.0',  VALUE.FALSE],
						['0   === -0.0', VALUE.FALSE],
						['-0  === 0.0',  VALUE.FALSE],
						['-0  === -0.0', VALUE.FALSE],
						['3   === 3.0',  VALUE.FALSE],

						['0   == -0',   VALUE.TRUE],
						['0.0 == -0.0', VALUE.TRUE],
						['0   == 0.0',  VALUE.TRUE],
						['0   == -0.0', VALUE.TRUE],
						['-0  == 0.0',  VALUE.TRUE],
						['-0  == -0.0', VALUE.TRUE],
						['3   == 3.0',  VALUE.TRUE],
					]));
				});
				it('returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
					setupScript(`{
						let a: anything = [];
						let b: anything = [42];
						let c: anything = [x= 42];
						let d: Object   = {41 -> 42};
						a !== [];
						b !== [42];
						c !== [x= 42];
						d !== {41 -> 42};
						a === a;
						b === b;
						c === c;
						d === d;
						a == [];
						b == [42];
						c == [x= 42];
						d == {41 -> 42};
						b != [42, 43];
						c != [x= 43];
						c != [y= 42];
						d != {41 -> 43};
						d != {43 -> 42};
					}`, null, {build: false}).stmts.slice(4).forEach((stmt) => {
						const expr: AST.ASTNodeOperationBinaryEquality = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinaryEquality;
						const fold: VALUE.Value | null = expr.fold();
						assert_instanceof(fold, VALUE.Boolean);
						assertEqualTypes(
							expr.type(),
							new TYPE.Unit<VALUE.Boolean>(fold),
						);
					});
				});
			});
			context('with folding off.', () => {
				context('for numeric types.', () => {
					it('for equality (`==`), coerces ints to floats when mixed.', () => {
						assert.strictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('7 == 7.0', CONFIG_FOLDING_OFF).type(), TYPE.BOOL);
						assert.strictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('1 == 2',   CONFIG_FOLDING_OFF).type(), TYPE.BOOL);
					});
					it('for identity (`===`), returns `false` if operands are of different numeric types.', () => {
						assert.strictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('7 === 7.0', CONFIG_FOLDING_OFF).type(), TYPE.FALSE);
						assert.strictEqual(AST.ASTNodeOperationBinaryEquality.fromSource('1 === 2',   CONFIG_FOLDING_OFF).type(), TYPE.FALSE);
					});
					it('returns `bool` when operands are same numeric type.', () => {
						xjs.Array.forEachAggregated(`
							1 === 1
							1 ==  1
						`.split('\n').slice(1, -1), (expr) => assert.strictEqual(typeOfOperationFromSource(expr), TYPE.BOOL));
					});
				});
				it('returns `false` when operands are of the same primitive type but have different values.', () => {
					xjs.Array.forEachAggregated(`
						@symb1  === @symb2
						"hello" === "world"
						@symb1  ==  @symb2
						"hello" ==  "world"
					`.split('\n').slice(1, -1), (expr) => assert.strictEqual(typeOfOperationFromSource(expr), TYPE.FALSE));
				});
				it('returns `bool` when operands are of the same primitive type and have the same value.', () => {
					xjs.Array.forEachAggregated(`
						@symb1  === @symb1
						"hello" === "hello"
						@symb1  ==  @symb1
						"hello" ==  "hello"
					`.split('\n').slice(1, -1), (expr) => assert.strictEqual(typeOfOperationFromSource(expr), TYPE.BOOL));
				});
				it('returns `false` if operands are of disjoint types in general.', () => {
					assert.strictEqual(typeOfOperationFromSource('7      == null'), TYPE.FALSE);
					assert.strictEqual(typeOfOperationFromSource('@symb1 == 256'),  TYPE.FALSE);
				});
			});
		});


		describe('#fold', () => {
			it('simple non-numeric types.', () => {
				foldOperations(new Map([
					['null === null',                          VALUE.TRUE],
					['null ==  null',                          VALUE.TRUE],
					['null === 5',                             VALUE.FALSE],
					['null ==  5',                             VALUE.FALSE],
					['true === 1',                             VALUE.FALSE],
					['true ==  1',                             VALUE.FALSE],
					['true === 1.0',                           VALUE.FALSE],
					['true ==  1.0',                           VALUE.FALSE],
					['true === 5.1',                           VALUE.FALSE],
					['true ==  5.1',                           VALUE.FALSE],
					['true === true',                          VALUE.TRUE],
					['true ==  true',                          VALUE.TRUE],
					['@a === @a',                              VALUE.TRUE],
					['@a ==  @a',                              VALUE.TRUE],
					['@a === @b',                              VALUE.FALSE],
					['@a ==  @b',                              VALUE.FALSE],
					['@a === 256',                             VALUE.FALSE], // TODO: turn on integerRadices
					['@a ==  256',                             VALUE.FALSE], // TODO: turn on integerRadices
					['@a === @\'a\'',                          VALUE.FALSE],
					['@a ==  @\'a\'',                          VALUE.FALSE],
					['@\'a\' === @\'\\u{61}\'',                VALUE.FALSE],
					['@\'a\' ==  @\'\\u{61}\'',                VALUE.FALSE],
					['@\'\\u{61}\' === @\'\\u{61}\'',          VALUE.TRUE],
					['@\'\\u{61}\' ==  @\'\\u{61}\'',          VALUE.TRUE],
					['"" == ""',                               VALUE.TRUE],
					['"a" === "a"',                            VALUE.TRUE],
					['"a" ==  "a"',                            VALUE.TRUE],
					['"hello\\u{20}world" === "hello world"',  VALUE.TRUE],
					['"hello\\u{20}world" ==  "hello world"',  VALUE.TRUE],
					['"a" !== "b"',                            VALUE.TRUE],
					['"a" !=  "b"',                            VALUE.TRUE],
					['"hello\\u{20}world" !== "hello20world"', VALUE.TRUE],
					['"hello\\u{20}world" !=  "hello20world"', VALUE.TRUE],
				]));
			});
			context('numeric types.', () => {
				it('for identity (`===`), always returns `false` for distinct values.', () => {
					foldOperations(new Map<string, VALUE.Value>([
						['0   === -0',   VALUE.TRUE],
						['0.0 === -0.0', VALUE.FALSE],
						['0   === 0.0',  VALUE.FALSE],
						['0   === -0.0', VALUE.FALSE],
						['-0  === 0.0',  VALUE.FALSE],
						['-0  === -0.0', VALUE.FALSE],
						['3   === 3.0',  VALUE.FALSE],
					]));
				});
				it('for equality (`==`), only returns `true` for mathematically equal values (coerces ints to floats when mixed).', () => {
					foldOperations(new Map<string, VALUE.Value>([
						['0   == -0',   VALUE.TRUE],
						['0.0 == -0.0', VALUE.TRUE],
						['0   == 0.0',  VALUE.TRUE],
						['0   == -0.0', VALUE.TRUE],
						['-0  == 0.0',  VALUE.TRUE],
						['-0  == -0.0', VALUE.TRUE],
						['3   == 3.0',  VALUE.TRUE],
					]));
				});
			});
			it('compound types.', () => {
				setupScript(`{
					let a: anything = [];
					let b: anything = [42];
					let c: anything = [x= 42];
					let d: Object   = List.<int>([]);
					let e: Object   = List.<int>([42]);
					let f: Object   = Dict.<int>([x= 42]);
					let g: Object   = {};
					let h: Object   = {42};
					let i: Object   = {41 -> 42};

					let bb: anything = [[42]];
					let cc: anything = [x= [42]];
					let hh: Object   = {[42]};
					let ii: Object   = {[41] -> [42]};

					a === [];
					b === [42];
					c === [x= 42];
					d !== List.<int>([]);
					e !== List.<int>([42]);
					f !== Dict.<int>([x= 42]);
					g !== {};
					h !== {42};
					i !== {41 -> 42};
					a === a;
					b === b;
					c === c;
					d === d;
					e === e;
					f === f;
					g === g;
					h === h;
					i === i;
					a == [];
					b == [42];
					c == [x= 42];
					d == List.<int>([]);
					e == List.<int>([42]);
					f == Dict.<int>([x= 42]);
					g == {};
					h == {42};
					i == {41 -> 42};

					bb === [[42]];
					cc === [x= [42]];
					hh !== {[42]};
					ii !== {[41] -> [42]};
					bb === bb;
					cc === cc;
					hh === hh;
					ii === ii;
					bb == [[42]];
					cc == [x= [42]];
					hh == {[42]};
					ii == {[41] -> [42]};

					b != [42, 43];
					c != [x= 43];
					c != [y= 42];
					i != {41 -> 43};
					i != {43 -> 42};
				}`, null, {build: false}).stmts.slice(13).forEach((stmt) => {
					assert.strictEqual((stmt as AST.ASTNodeStatementExpression).expr!.fold(), VALUE.TRUE, stmt.source);
				});
			});
			it('compound value types’ constituents are compared using same operand.', () => {
				foldOperations(new Map([
					['[   42.0] === [   42]',   VALUE.FALSE],
					['[   42.0] ==  [   42]',   VALUE.TRUE],
					['[a= 42.0] === [a= 42]',   VALUE.FALSE],
					['[a= 42.0] ==  [a= 42]',   VALUE.TRUE],
					['[    0.0] === [   -0.0]', VALUE.FALSE],
					['[    0.0] ==  [   -0.0]', VALUE.TRUE],
					['[a=  0.0] === [a= -0.0]', VALUE.FALSE],
					['[a=  0.0] ==  [a= -0.0]', VALUE.TRUE],
				]));
			});
		});


		describe('#build', () => {
			function drop_then_false(mod: binaryen.Module, expr1: binaryen.ExpressionRef, expr2: binaryen.ExpressionRef): binaryen.ExpressionRef {
				return drop_then(mod, [expr1, expr2], false);
			}

			context('identity (`===`).', () => {
				it('optimizes by evaluating operand types.', () => {
					buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
						['42  === 420',  (builder) => drop_then_false(builder.module, buildConst(builder, 42n), buildConst(builder, 420n))],
						['4.2 === 42.0', (builder) => drop_then_false(builder.module, buildConst(builder, 4.2), buildConst(builder, 42.0))],

						['42  === 4.2', (builder) => drop_then_false(builder.module, buildConst(builder, 42n), buildConst(builder, 4.2))],
						['4.2 === 42',  (builder) => drop_then_false(builder.module, buildConst(builder, 4.2), buildConst(builder, 42n))],

						['null === 0',   (builder) => drop_then_false(builder.module, buildConst(builder), buildConst(builder, 0n))],
						['null === 0.0', (builder) => drop_then_false(builder.module, buildConst(builder), buildConst(builder, 0.0))],

						['null  === false', (builder) => drop_then_false(builder.module, buildConst(builder), buildConst(builder, false))],
						['null  === true',  (builder) => drop_then_false(builder.module, buildConst(builder), buildConst(builder, true))],
						['false === true',  (builder) => drop_then_false(builder.module, buildConst(builder, false), buildConst(builder, true))],

						['false === 0',   (builder) => drop_then_false(builder.module, buildConst(builder, false), buildConst(builder, 0n))],
						['false === 0.0', (builder) => drop_then_false(builder.module, buildConst(builder, false), buildConst(builder, 0.0))],

						['true === 1',   (builder) => drop_then_false(builder.module, buildConst(builder, true), buildConst(builder, 1n))],
						['true === 1.0', (builder) => drop_then_false(builder.module, buildConst(builder, true), buildConst(builder, 1.0))],

						['@a === null',  (builder) => drop_then_false(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder))],
						['@a === false', (builder) => drop_then_false(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder, false))],
						['@a === 256',   (builder) => drop_then_false(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder, 0x100n))], // TODO: turn on integerRadices
						['@a === @b',    (builder) => drop_then_false(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder, 0x101n))],
					]));
				});
				it('calls `vid` when operands are same numeric type.', () => {
					const {stmts, mod} = setupScript(`{
						let var i1: int   = 42;
						let var i2: int   = 420;
						let var f1: float = 4.2;
						let var f2: float = 42.0;
						i1 === i2;
						f1 === f2;
					}`);
					return assertEqualBins(new Map(stmts.slice(4).map((stmt, i) => [
						(stmt as AST.ASTNodeStatementExpression).expr!.build(),
						CALL.vid(
							mod,
							mod.local.get(2 * i,     binaryen.v128),
							mod.local.get(2 * i + 1, binaryen.v128),
						),
					])));
				});
				it('calls `vid` when operands are of the same primitive type.', () => {
					buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
						['@a === @a', (builder) => CALL.vid(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder, Symbol(0x100)))],
					]));
				});
			});

			context('equality (`==`).', () => {
				it('optimizes by evaluating operand types, ignoring numeric types.', () => {
					buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
						['null == 0',   (builder) => drop_then_false(builder.module, buildConst(builder), buildConst(builder, 0n))],
						['null == 0.0', (builder) => drop_then_false(builder.module, buildConst(builder), buildConst(builder, 0.0))],

						['null  == false', (builder) => drop_then_false(builder.module, buildConst(builder), buildConst(builder, false))],
						['null  == true',  (builder) => drop_then_false(builder.module, buildConst(builder), buildConst(builder, true))],
						['false == true',  (builder) => drop_then_false(builder.module, buildConst(builder, false), buildConst(builder, true))],

						['false == 0',   (builder) => drop_then_false(builder.module, buildConst(builder, false), buildConst(builder, 0n))],
						['false == 0.0', (builder) => drop_then_false(builder.module, buildConst(builder, false), buildConst(builder, 0.0))],

						['true == 1',   (builder) => drop_then_false(builder.module, buildConst(builder, true), buildConst(builder, 1n))],
						['true == 1.0', (builder) => drop_then_false(builder.module, buildConst(builder, true), buildConst(builder, 1.0))],

						['@a == null',  (builder) => drop_then_false(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder))],
						['@a == false', (builder) => drop_then_false(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder, false))],
						['@a == 256',   (builder) => drop_then_false(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder, 0x100n))], // TODO: turn on integerRadices
						['@a == @b',    (builder) => drop_then_false(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder, 0x101n))],
					]));
				});
				it('calls `veq` when operands are same numeric type or when int coercion is allowed.', () => {
					buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
						['42  == 420',  (builder) => CALL.veq(builder.module, buildConst(builder, 42n), buildConst(builder, 420n))],
						['42  == 4.2',  (builder) => CALL.veq(builder.module, buildConst(builder, 42n), buildConst(builder, 4.2))],
						['4.2 == 42',   (builder) => CALL.veq(builder.module, buildConst(builder, 4.2), buildConst(builder, 42n))],
						['4.2 == 42.0', (builder) => CALL.veq(builder.module, buildConst(builder, 4.2), buildConst(builder, 42.0))],
					]));
					const {stmts, mod} = setupScript(`{
						let var i1: int   = 42;
						let var i2: int   = 420;
						let var f1: float = 4.2;
						let var f2: float = 42.0;
						i1 == i2;
						f1 == f2;
					}`);
					return assertEqualBins(new Map(stmts.slice(4).map((stmt, i) => [
						(stmt as AST.ASTNodeStatementExpression).expr!.build(),
						CALL.veq(
							mod,
							mod.local.get(2 * i,     binaryen.v128),
							mod.local.get(2 * i + 1, binaryen.v128),
						),
					])));
				});
				it('calls `veq` when operands are of the same primitive type.', () => {
					buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
						['@a == @a', (builder) => CALL.veq(builder.module, buildConst(builder, Symbol(0x100)), buildConst(builder, Symbol(0x100)))],
					]));
				});
			});
		});
	});



	describe('ASTNodeOperationBinaryLogical', () => {
		describe('#type', () => {
			it('with constant folding on.', () => {
				typeOperations(new Map<string, VALUE.Primitive>([
					['null     && false',    VALUE.NULL],
					['false    && null',     VALUE.FALSE],
					['true     && null',     VALUE.NULL],
					['@nothing && @x',       new VALUE.Symbol(0x100n, 'x')],
					['@x       && @nothing', VALUE.SYM_NOTHING],
					['@nothing || @y',       VALUE.SYM_NOTHING],
					['@y       || @nothing', new VALUE.Symbol(0x100n, 'y')],
					['@z       && false',    VALUE.FALSE],
					['true     && @z',       new VALUE.Symbol(0x100n, 'z')],
					['false    && 42',       VALUE.FALSE],
					['4.2      && true',     VALUE.TRUE],
					['null     || false',    VALUE.FALSE],
					['false    || null',     VALUE.NULL],
					['true     || null',     VALUE.TRUE],
					['false    || 42',       new VALUE.Integer(42n)],
					['4.2      || true',     new VALUE.Float(4.2)],
				]));
			});
			context('with constant folding off.', () => {
				describe('[operator=AND]', () => {
					it('returns `left` if it’s a subtype of `null | false`.', () => {
						assertEqualTypes(setupScript(`{
							let var a: null = null;
							let var b: null | false = null;
							a && 42;
							b && 42;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL,
							TYPE.NULL.union(TYPE.FALSE),
						]);
					});
					it('returns `T | right` if left is a supertype of `T narrows null | false`.', () => {
						const hello: TYPE.Unit<VALUE.String> = typeUnit('hello');
						return assertEqualTypes(setupScript(`{
							let var a: null | int = null;
							let var b: null | int = 42;
							let var c: bool = false;
							let var d: bool | float = 4.2;
							a && "hello";
							b && "hello";
							c && "hello";
							d && "hello";
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(4).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.NULL.union(hello),
							TYPE.NULL.union(hello),
							TYPE.FALSE.union(hello),
							TYPE.FALSE.union(hello),
						]);
					});
					it('returns `right` if left does not contain `null` nor `false`.', () => {
						assertEqualTypes(setupScript(`{
							let var a: int = 42;
							let var b: float = 4.2;
							a && true;
							b && null;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.TRUE,
							TYPE.NULL,
						]);
					});
				});
				describe('[operator=OR]', () => {
					it('returns `right` if left is a subtype of `null | false`.', () => {
						assertEqualTypes(setupScript(`{
							let var a: null = null;
							let var b: null | false = null;
							a || false;
							b || 42;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.FALSE,
							typeUnit(42n),
						]);
					});
					it('returns `(left - T) | right` if left is a supertype of `T narrows null | false`.', () => {
						const hello: TYPE.Unit<VALUE.String> = typeUnit('hello');
						assertEqualTypes(setupScript(`{
							let var a: null | int = null;
							let var b: null | int = 42;
							let var c: bool = false;
							let var d: bool | float = 4.2;
							a || "hello";
							b || "hello";
							c || "hello";
							d || "hello";
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(4).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.INT.union(hello),
							TYPE.INT.union(hello),
							TYPE.TRUE.union(hello),
							TYPE.TRUE.union(TYPE.FLOAT).union(hello),
						]);
					});
					it('returns `left` if it does not contain `null` nor `false`.', () => {
						assertEqualTypes(setupScript(`{
							let var a: int = 42;
							let var b: float = 4.2;
							a || true;
							b || null;
						}`, CONFIG_FOLDING_OFF, {build: false}).stmts.slice(2).map((stmt) => typeOfStmtExpr(stmt)), [
							TYPE.INT,
							TYPE.FLOAT,
						]);
					});
				});
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, VALUE.Value>([
				['@nothing && @x',       new VALUE.Symbol(0x100n, 'x')],
				['@x       && @nothing', VALUE.SYM_NOTHING],
				['@nothing || @y',       VALUE.SYM_NOTHING],
				['@y       || @nothing', new VALUE.Symbol(0x100n, 'y')],
				['@z       && false',    VALUE.FALSE],
				['true     && @z',       new VALUE.Symbol(0x100n, 'z')],
				['null     && 5',        VALUE.NULL],
				['null     || 5',        new VALUE.Integer(5n)],
				['5        && null',     VALUE.NULL],
				['5        || null',     new VALUE.Integer(5n)],
				['5.1      && true',     VALUE.TRUE],
				['5.1      || true',     new VALUE.Float(5.1)],
				['3.1      && 5',        new VALUE.Integer(5n)],
				['3.1      || 5',        new VALUE.Float(3.1)],
				['false    && null',     VALUE.FALSE],
				['false    || null',     VALUE.NULL],
			]));
		});


		describe('#build', () => {
			/**
			 * A helper for creating a conditional expression.
			 * Given a value to tee and callbacks to perform giving the condition and branches,
			 * return an `(if)` whose condition and branches are given by the callback.
			 * @param mod       the module to perform the conditional
			 * @param tee       parameters for teeing the value:
			 *                  [
			 *                  	the local index to tee the value,
			 *                  	the value,
			 *                  	the value’s type,
			 *                  ]
			 * @param branches  the callback to perform; given a getter, returns two branches: [if_true, if_false]
			 * @return          the new `(if)` expression
			 */
			function create_if(
				mod:                binaryen.Module,
				[index, arg, type]: [number, binaryen.ExpressionRef, binaryen.Type],
				branches:           (local_get: binaryen.ExpressionRef) => [binaryen.ExpressionRef, binaryen.ExpressionRef],
			): binaryen.ExpressionRef {
				return mod.if(
					new BinVect(mod, mod.call(
						'vnot',
						[mod.local.tee(index, arg, type)],
						binaryen.v128,
					)).isSpecial(false),
					...branches.call(null, mod.local.get(index, type)),
				);
			}

			it('optimizes by evaluating left operand type.', () => {
				buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
					['42 && 420',        (builder) => drop_then(builder.module, [buildConst(builder, 42n)], buildConst(builder, 420n))],
					['4.2 || -420',      (builder) => buildConst(builder, 4.2)],
					['null && 201.0e-1', (builder) => buildConst(builder)],
					['false || null',    (builder) => drop_then(builder.module, [buildConst(builder, false)], buildConst(builder))],
					['true && 201.0e-1', (builder) => drop_then(builder.module, [buildConst(builder, true)], buildConst(builder, 20.1))],

					['1 && 2 || 3 && 4', (builder) => drop_then(
						builder.module,
						[buildConst(builder, 1n)],
						buildConst(builder, 2n),
					)],
					['null && 2 || 3 && null', (builder) => drop_then(
						builder.module,
						[buildConst(builder)],
						drop_then(
							builder.module,
							[buildConst(builder, 3n)],
							buildConst(builder),
						),
					)],
					['(1 || 2) && (3 || 4)', (builder) => drop_then(
						builder.module,
						[buildConst(builder, 1n)],
						buildConst(builder, 3n),
					)],
					['(1 || null) && (null || 4)', (builder) => drop_then(
						builder.module,
						[buildConst(builder, 1n)],
						drop_then(
							builder.module,
							[buildConst(builder)],
							buildConst(builder, 4n),
						),
					)],
				]));
			});

			it('returns a special case of `(if)`.', () => {
				const {stmts, mod} = setupScript(`{
					let a: anything = 42;
					let b: anything = 4.2;
					let c: anything = null;
					let d: anything = false;
					let e: anything = true;

					a && 420;
					b || -420;
					c && 201.0e-1;
					d || null;
					e && 201.0e-1;
				}`, CONFIG_FOLDING_OFF);
				const extracts: readonly (readonly binaryen.ExpressionRef[])[] = stmts.slice(5).map((stmt) => {
					const binexp = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary;
					return [
						binexp.operand0.build(),
						binexp.operand1.build(),
					];
				});
				return assertEqualBins(
					stmts.slice(5).map((stmt) => stmt.build()),
					[
						create_if(
							mod,
							[5, extracts[0][0], binaryen.v128],
							(getter) => [extracts[0][1], getter],
						),
						create_if(
							mod,
							[6, extracts[1][0], binaryen.v128],
							(getter) => [getter, extracts[1][1]],
						),
						create_if(
							mod,
							[7, extracts[2][0], binaryen.v128],
							(getter) => [extracts[2][1], getter],
						),
						create_if(
							mod,
							[8, extracts[3][0], binaryen.v128],
							(getter) => [getter, extracts[3][1]],
						),
						create_if(
							mod,
							[9, extracts[4][0], binaryen.v128],
							(getter) => [extracts[4][1], getter],
						),
					].map((expected) => mod.drop(expected)),
				);
			});

			it('counts internal variables correctly.', () => {
				const {stmts, mod} = setupScript(`{
					let a: anything = 1;
					let b: anything = 2;
					let c: anything = 3;
					let d: anything = 4;

					a && b || c && d;
					(a || b) && (c || d);
				}`, CONFIG_FOLDING_OFF);
				const extracts: readonly (readonly (readonly binaryen.ExpressionRef[])[])[] = stmts.slice(4).map((stmt) => {
					const binexp = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationBinary;
					const outer0 = binexp.operand0 as AST.ASTNodeOperationBinary;
					const outer1 = binexp.operand1 as AST.ASTNodeOperationBinary;
					return [
						[outer0.operand0.build(), outer0.operand1.build()],
						[outer1.operand0.build(), outer1.operand1.build()],
					];
				});
				return assertEqualBins(
					stmts.slice(4).map((stmt) => stmt.build()),
					[
						create_if(
							mod,
							[6, create_if(
								mod,
								[4, extracts[0][0][0], binaryen.v128],
								(getter) => [extracts[0][0][1], getter],
							), binaryen.v128],
							(getter) => [getter, create_if(
								mod,
								[5, extracts[0][1][0], binaryen.v128],
								(getter_) => [extracts[0][1][1], getter_],
							)],
						),
						create_if(
							mod,
							[9, create_if(
								mod,
								[7, extracts[1][0][0], binaryen.v128],
								(getter) => [getter, extracts[1][0][1]],
							), binaryen.v128],
							(getter) => [create_if(
								mod,
								[8, extracts[1][1][0], binaryen.v128],
								(getter_) => [getter_, extracts[1][1][1]],
							), getter],
						),
					].map((expected) => mod.drop(expected)),
				);
			});
		});
	});



	describe('ASTNodeOperationTernary', () => {
		describe('#type', () => {
			context('with constant folding on.', () => {
				it('computes type for for conditionals.', () => {
					typeOperations(new Map<string, VALUE.Primitive>([
						['if true then false else 2',          VALUE.FALSE],
						['if false then 3.0 else null',        VALUE.NULL],
						['if true then 2 else 3.0',            new VALUE.Integer(2n)],
						['if false then 2 + 3 else 1.0 * 2.0', new VALUE.Float(2.0)],
					]));
				});
			});
			it('returns `nothing` when condition is `nothing`.', () => {
				const ternary: AST.ASTNodeOperationTernary = AST.ASTNodeOperationTernary.fromSource('if n as <nothing> then true else false');
				ternary.validator.addSymbol(new SymbolSchemaVar(
					// @ts-expect-error --- it’s private
					(ternary.operand0 as AST.ASTNodeClaim).operand as AST.ASTNodeVariable,
					false,
					false,
				));
				return assert.ok(ternary.type().isBottomType);
			});
			it('throws when condition is not a subtype of `boolean`.', () => {
				assert.throws(() => AST.ASTNodeOperationTernary.fromSource('if 2 then true else false').type(), TypeErrorInvalidOperation);
			});
		});


		specify('#fold', () => {
			foldOperations(new Map<string, VALUE.Value>([
				['if true then false else 2',          VALUE.FALSE],
				['if false then 3.0 else null',        VALUE.NULL],
				['if true then 2 else 3.0',            new VALUE.Integer(2n)],
				['if false then 2 + 3 else 1.0 * 2.0', new VALUE.Float(2.0)],
			]));
		});


		describe('#build', () => {
			it('optimizes by evaluating condition operand type.', () => {
				buildOperations(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
					['if true  then false else 2',    (builder) => drop_then(builder.module, [buildConst(builder, true)],  buildConst(builder, false))],
					['if true  then 2     else 3.0',  (builder) => drop_then(builder.module, [buildConst(builder, true)],  buildConst(builder, 2n))],
					['if false then 3.0   else null', (builder) => drop_then(builder.module, [buildConst(builder, false)], buildConst(builder))],
				]));
			});
			it('returns `(if)`.', () => {
				const {stmts, mod} = setupScript(`{
					let a: bool = true;
					let b: bool = false;

					if a then 1 else 2;
					if b then 3 else 4;
				}`, CONFIG_FOLDING_OFF);
				const extracts: readonly (readonly binaryen.ExpressionRef[])[] = stmts.slice(2).map((stmt) => {
					const terexp = (stmt as AST.ASTNodeStatementExpression).expr as AST.ASTNodeOperationTernary;
					return [
						terexp.operand0.build(),
						terexp.operand1.build(),
						terexp.operand2.build(),
					];
				});
				return assertEqualBins(
					stmts.slice(2).map((stmt) => stmt.build()),
					[
						mod.if(new BinVect(mod, extracts[0][0]).isSpecial(true), extracts[0][1], extracts[0][2]),
						mod.if(new BinVect(mod, extracts[1][0]).isSpecial(true), extracts[1][1], extracts[1][2]),
					].map((expected) => mod.drop(expected)),
				);
			});
		});
	});
});
