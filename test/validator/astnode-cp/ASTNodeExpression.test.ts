import * as assert from 'node:assert';
import * as test from 'node:test';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	AST,
	SymbolSchemaType,
	SymbolSchemaVar,
	VALUE,
	TYPE,
	type Builder,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateKey,
	TypeErrorNotAssignable,
} from '../../../src/index.ts';
import {
	assertEqualTypes,
	assertEqualBins,
	assertAssignable,
} from '../../assert-helpers.ts';
import {
	setupScript,
	typeUnit,
	buildConst,
	singletonTuple,
} from '../../helpers.ts';
import {extract_tokens} from '../../utils.ts';



test.suite('ASTNodeExpression', () => {
	test.suite('ASTNodeConstant', () => {
		test.suite('#varCheck', () => {
			test.test('never throws.', () => {
				AST.ASTNodeConstant.fromSource('42').varCheck();
			});
		});


		test.suite('#type', () => {
			test.test('returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
				const constants: AST.ASTNodeConstant[] = extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					55  -55  +033  -033  0  -0
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					"42😀"  "42\\u{1f600}"
				`).map((src) => AST.ASTNodeConstant.fromSource(src));
				return assertEqualTypes(
					constants.map((c) => c.type()),
					constants.map((c) => new TYPE.Unit(c.fold())),
				);
			});
		});


		/* eslint-disable @stylistic/array-element-newline */
		test.suite('#fold', () => {
			test.test('computes null, boolean, and symbol values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
				`).map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
					new VALUE.Symbol(0x93n,  'then'),
					new VALUE.Symbol(0x87n,  'str'),
					new VALUE.Symbol(0x8an,  'false'),
					new VALUE.Symbol(0x100n, 'foobar'),
				]);
			});
			test.test('computes int values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`).map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new VALUE.Integer(BigInt(v))));
			});
			test.test('computes nat values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					+55  +033  +0
					+\\o55  +\\q033
				`).map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					55, 33, 0,
					parseInt('55', 8), parseInt('33', 4),
				].map((v) => new VALUE.Natural(BigInt(v))));
			});
			test.test('computes float values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`).map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new VALUE.Float(v)));
			});
			test.test('computes string values.', () => {
				assertEqualTypes(
					AST.ASTNodeConstant.fromSource('"42😀\\u{1f600}"').type(),
					typeUnit('42😀\u{1f600}'),
				);
			});
		});
		/* eslint-enable @stylistic/array-element-newline */


		test.test('#build', () => {
			xjs.Map.forEachAggregated(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
				['null',     (builder) => buildConst(builder)],
				['false',    (builder) => buildConst(builder, false)],
				['true',     (builder) => buildConst(builder, true)],
				['@nothing', (builder) => buildConst(builder, Symbol(0x80))],
				['@hello',   (builder) => buildConst(builder, Symbol(0x100))],
				['0',        (builder) => buildConst(builder, 0n)],
				['-0',       (builder) => buildConst(builder, 0n)],
				['+0',       (builder) => buildConst(builder, 0n, 'nat')],
				['42',       (builder) => buildConst(builder, 42n)],
				['-42',      (builder) => buildConst(builder, -42n)],
				['+42',      (builder) => buildConst(builder, 42n, 'nat')],
				['0.0',      (builder) => buildConst(builder, 0)],
				['+0.0',     (builder) => buildConst(builder, 0)],
				['-0.0',     (builder) => buildConst(builder, -0)],
				['-4.2e-2',  (builder) => buildConst(builder, -0.042)],
			]), (expected_fn, src) => {
				const constant: AST.ASTNodeConstant = AST.ASTNodeConstant.fromSource(src);
				return assertEqualBins(
					constant.build(),
					expected_fn.call(null, constant.builder),
				);
			});
		});
	});



	test.suite('ASTNodeVariable', () => {
		test.suite('#varCheck', () => {
			test.test('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`{
					let var i: int = 42;
					i;
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource('i').varCheck(), ReferenceErrorUndeclared);
			});
			test.test('throws when declared in an inner scope.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					if true then {
						let var i: int = 42;
					};
					i;
				}`).varCheck(), ReferenceErrorUndeclared);
			});
			test.test.todo('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					i;
					let var i: int = 42;
				}`).varCheck(), ReferenceErrorDeadZone);
			});
			test.test('throws if it was declared as a type alias.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					type FOO = int;
					42 || FOO;
				}`).varCheck(), ReferenceErrorKind);
			});
			test.test('iteration variable of `for` loop is scoped only to the block.', () => {
				AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3] do {
						it;
					};
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3, it] do {
						42;
					};
				}`).varCheck(), ReferenceErrorUndeclared, 'iteraion variable cannot be referenced in the iterator expression.');
				assert.throws(() => AST.ASTNodeGoal.fromSource(`{
					for it: float in [1.1, 2.2, 3.3] do {
						42;
					};
					it;
				}`).varCheck(), ReferenceErrorUndeclared, 'iteration variable cannot be referenced after the iteration statement.');
			});
		});


		test.suite('#type', () => {
			test.test('unions with `null` when accessed variable is uninitialized.', () => {
				const {stmts} = setupScript(`{
					let var w:  int = 42;
					let var x?: int;
					w;
					x;
				}`, null, {build: false});
				assert.ok( (stmts[0] as AST.ASTNodeDeclarationVariable).assigned);
				assert.ok(!(stmts[1] as AST.ASTNodeDeclarationVariable).assigned);
				return assertEqualTypes(
					stmts.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
					[
						TYPE.INT,
						TYPE.INT.union(TYPE.NULL),
					],
				);
			});
		});


		test.suite('#fold', () => {
			test.test('assesses the value of a fixed variable.', () => {
				const {stmts} = setupScript(`{
					let x: int = 21 * 2;
					x;
				}`, null, {build: false});
				assert.ok(!(stmts[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					new VALUE.Integer(42n),
				);
			});
			test.test('returns null for an unfixed variable.', () => {
				const {stmts} = setupScript(`{
					let var x: int = 21 * 2;
					x;
				}`, null, {build: false});
				assert.ok((stmts[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			test.test('returns null for a fixed variable of mutable type.', () => {
				const {stmts} = setupScript(`{
					let fixed_mutable: mut {int} = {1, 2, 3};
					fixed_mutable;
				}`, null, {build: false});
				assert.ok((stmts[0] as AST.ASTNodeDeclarationVariable).typenode.eval().hasMutable);
				assert.deepStrictEqual(
					(stmts[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			test.test('returns null for an uncomputable fixed variable.', () => {
				const {stmts} = setupScript(`{
					let var x: int = 21 * 2;
					let y: int = x / 2;
					y;
					let z: mut {int} = {11, 22, 33};
					let w: bool = z.[22];
					w;
				}`, null, {build: false});
				assert.ok(!(stmts[1] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.ok(!(stmts[4] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					[
						(stmts[2] as AST.ASTNodeStatementExpression).expr!.fold(),
						(stmts[5] as AST.ASTNodeStatementExpression).expr!.fold(),
					],
					[null, null],
				);
			});
		});


		test.suite('#build', () => {
			test.test('with constant folding on, returns `({i32,f64}.const)` for fixed & foldable variables.', () => {
				const {goal, stmts} = setupScript(`{
					let x: int = 42;
					let y: float = 4.2 * 10.0;
					x;
					y;
				}`);
				assertEqualBins(
					[
						(stmts[2] as AST.ASTNodeStatementExpression).expr!.build(),
						(stmts[3] as AST.ASTNodeStatementExpression).expr!.build(),
					],
					[
						buildConst(goal.builder, 42n),
						buildConst(goal.builder, 42.0),
					],
				);
			});
			test.test('with constant folding on, returns `(local.get)` for unfixed / non-foldable variables.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let var x: int = 42;
					let y: int = x + 10;
					x;
					y;
				}`);
				const var0 = (stmts[2] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const var1 = (stmts[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const types: readonly binaryen.Type[] = goal.builder.getLocals().map((local) => local.type);
				return assertEqualBins(
					[
						var0.build(),
						var1.build(),
					],
					[
						mod.local.get(0, types[0]),
						mod.local.get(2, types[2]),
					],
				);
			});
		});
	});



	test.suite('ASTNodeTemplate', () => {
		function initTemplates(): AST.ASTNodeTemplate[] {
			return [
				AST.ASTNodeTemplate.fromSource('"""42😀"""'),
				AST.ASTNodeTemplate.fromSource('"""the answer is {{ 7 * 3 * 2 }} but what is the question?"""'),
				(setupScript(`{
					let var x: int = 21;
					"""the answer is {{ x * 2 }} but what is the question?""";
				}`, null, {build: false}).stmts[1] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTemplate,
			];
		}
		test.suite('#type', () => {
			let templates: readonly AST.ASTNodeTemplate[] = [];
			test.suite('with constant folding on.', () => {
				let types: TYPE.Type[] = [];
				test.test.before(() => {
					templates = initTemplates();
					types = templates.map((t) => t.type());
				});
				test.test('for foldable interpolations, returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
					assertEqualTypes(
						types.slice(0, 2),
						templates.slice(0, 2).map((t) => new TYPE.Unit<VALUE.String>(t.fold()!)),
					);
				});
				test.test('for non-foldable interpolations, returns `String`.', () => {
					assert.strictEqual(types[2], TYPE.STR);
				});
			});
		});


		test.suite('#fold', () => {
			let templates: AST.ASTNodeTemplate[] = [];
			test.test.before(() => {
				templates = initTemplates();
			});
			test.test('returns a constant String for ASTNodeTemplate with no interpolations.', () => {
				assert.deepStrictEqual(
					templates[0].fold(),
					new VALUE.String('42😀'),
				);
			});
			test.test('returns a constant String for ASTNodeTemplate with foldable interpolations.', () => {
				assert.deepStrictEqual(
					templates[1].fold(),
					new VALUE.String('the answer is 42 but what is the question?'),
				);
			});
			test.test('returns null for ASTNodeTemplate with dynamic interpolations.', () => {
				assert.deepStrictEqual(
					templates[2].fold(),
					null,
				);
			});
		});
	});



	test.suite('ASTNodeCollectionLiteral', () => {
		test.suite('#varCheck', () => {
			test.suite('ASTNode{{Type}Record,Dict}', () => {
				test.test('throws if containing duplicate keys.', () => {
					[
						AST.ASTNodeTypeRecord .fromSource('(a: int, b: float, c: str)'),
						AST.ASTNodeRecord     .fromSource('(a= 1, b= 2.0, c= "three")'),
						AST.ASTNodeDict       .fromSource('[a= 1, b= 2.0, c= "three"]'),
					].forEach((node) => node.varCheck()); // assert does not throw

					[
						AST.ASTNodeTypeRecord .fromSource('(a: int, b: float, a: str)'),
						AST.ASTNodeTypeRecord .fromSource('(_: int, b: float, _: str)'),
						AST.ASTNodeRecord     .fromSource('(a= 1, b= 2.0, a= "three")'),
						AST.ASTNodeRecord     .fromSource('(_= 1, b= 2.0, _= "three")'),
						AST.ASTNodeDict       .fromSource('[a= 1, b= 2.0, a= "three"]'),
						AST.ASTNodeDict       .fromSource('[_= 1, b= 2.0, _= "three"]'),
					].forEach((node) => assert.throws(() => node.varCheck(), AssignmentErrorDuplicateKey));

					new Map<AST.ASTNodeCP, string[]>([
						[AST.ASTNodeTypeRecord .fromSource('(c: int, d: float, c: str, d: bool)'),  ['c', 'd']],
						[AST.ASTNodeTypeRecord .fromSource('(e: int, f: float, e: str, e: bool)'),  ['e', 'e']],
						[AST.ASTNodeRecord     .fromSource('(c= 1, d= 2.0, c= "three", d= false)'), ['c', 'd']],
						[AST.ASTNodeRecord     .fromSource('(e= 1, f= 2.0, e= "three", e= false)'), ['e', 'e']],
						[AST.ASTNodeDict       .fromSource('[c= 1, d= 2.0, c= "three", d= false]'), ['c', 'd']],
						[AST.ASTNodeDict       .fromSource('[e= 1, f= 2.0, e= "three", e= false]'), ['e', 'e']],
					]).forEach((dupes, node) => assert.throws(() => node.varCheck(), (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
							cons:   AggregateError,
							errors: dupes.map((k) => ({
								cons:    AssignmentErrorDuplicateKey,
								message: `Duplicate record/dict key \`${ k }\`.`,
							})),
						});
						return true;
					}));
				});
			});
		});


		test.suite('#type', () => {
			test.test('with constant folding on.', () => {
				const expected: readonly TYPE.Unit[] = [typeUnit(1n), typeUnit(2.0), typeUnit('three')];
				const collections: readonly [
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeSet,
					AST.ASTNodeMap,
				] = [
					AST.ASTNodeTuple  .fromSource('(   1,    2.0,    "three")'),
					AST.ASTNodeRecord .fromSource('(a= 1, b= 2.0, _= "three")'),
					AST.ASTNodeSet    .fromSource('{   1,    2.0,    "three"}'),
					AST.ASTNodeMap.fromSource(`
						{
							"a" || "" -> 1,
							21 + 21   -> 2.0,
							3.0 * 1.0 -> "three",
						}
					`),
				];
				return assertEqualTypes(
					collections.map((node) => node.type()),
					[
						TYPE.Tuple.fromTypes(expected),
						TYPE.Record.fromTypes(new Map(collections[1].children.map((c, i) => [
							c.key.id,
							expected[i],
						]))),
						new TYPE.Set(TYPE.Union.all(expected), true),
						new TYPE.Map(
							TYPE.Union.all([typeUnit('a'), typeUnit(42n), typeUnit(3.0)]),
							TYPE.Union.all(expected),
							true,
						),
					],
				);
			});
			test.test('does not throw if value type contains reference type.', () => {
				setupScript(`{
					(   1,    [2.2],    "three");
					(a= 1, b= [2.2], c= "three");
				}`, null, {build: false}); // assert does not throw
			});
		});


		test.suite('#fold', () => {
			test.test('returns Tuple/Record for constant collections.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple  .fromSource('(   1,    2.0,    "three")'),
						AST.ASTNodeRecord .fromSource('(a= 1, b= 2.0, c= "three")'),
					].map((c) => c.fold()),
					[
						new VALUE.Tuple([
							new VALUE.Integer(1n),
							new VALUE.Float(2.0),
							new VALUE.String('three'),
						]),
						new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x100n, new VALUE.Integer(1n)],
							[0x101n, new VALUE.Float(2.0)],
							[0x102n, new VALUE.String('three')],
						])),
					],
				);
			});
			test.test('returns a constant List/Dict/Set/Map for foldable entries.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeList.fromSource('[1, 2.0, "three"]'),
						AST.ASTNodeDict.fromSource('[a= 1, b= 2.0, c= "three"]'),
						AST.ASTNodeSet.fromSource('{1, 2.0, "three"}'),
						AST.ASTNodeMap.fromSource(`
							{
								"a" || "" -> 1,
								21 + 21   -> 2.0,
								3.0 * 1.0 -> "three",
							}
						`),
					].map((c) => c.fold()),
					[
						new VALUE.List([
							new VALUE.Integer(1n),
							new VALUE.Float(2.0),
							new VALUE.String('three'),
						]),
						new VALUE.Dict(new Map<bigint, VALUE.Value>([
							[0x100n, new VALUE.Integer(1n)],
							[0x101n, new VALUE.Float(2.0)],
							[0x102n, new VALUE.String('three')],
						])),
						new VALUE.Set(new Set([
							new VALUE.Integer(1n),
							new VALUE.Float(2.0),
							new VALUE.String('three'),
						])),
						new VALUE.Map(new Map<VALUE.Value, VALUE.Value>([
							[new VALUE.String('a'),  new VALUE.Integer(1n)],
							[new VALUE.Integer(42n), new VALUE.Float(2.0)],
							[new VALUE.Float(3.0),   new VALUE.String('three')],
						])),
					],
				);
			});
			test.test('returns null for non-foldable entries.', () => {
				xjs.Array.forEachAggregated(setupScript(`{
					let var x: int   = 1;
					let var y: float = 2.0;
					let var z: str   = "three";
					(x, 2.0, "three");
					(a= 1, b= y, c= "three");
					[x, 2.0, "three"];
					[a= 1, b= y, c= "three"];
					{1, 2.0, z};
					{
						"a" || "" -> 1,
						21 + 21   -> 2.0,
						3.0 * 1.0 -> z,
					};
				}`, null, {build: false}).stmts.slice(3), (c) => assert.strictEqual((c as AST.ASTNodeStatementExpression).expr!.fold(), null));
			});
		});


		test.suite('#build', () => {
			const bintype2: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128]);
			const bintype3: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128, binaryen.v128]);

			function testModuleValidation(expr_src: string): void {
				setupScript(`{ ${ expr_src }; }`); // assert does not throw
			}

			test.suite('ASTNodeTuple', () => {
				test.test('returns `(tuple.make)`.', () => {
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource('(1, 2.0)');
					return assertEqualBins(
						tuple.build(),
						tuple.builder.module.tuple.make([buildConst(tuple.builder, 1n), buildConst(tuple.builder, 2.0)]),
					);
				});
				test.test('empty tuple returns unique BinVect representation.', () => {
					const src = '()';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src);
					return assertEqualBins(
						tuple.build(),
						buildConst(tuple.builder, []),
					);
				});
				test.test('tuple of length 1 returns a `(tuple.make)` with 1 item.', () => {
					const src = '(3.4,)';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src);
					return assertEqualBins(
						tuple.build(),
						singletonTuple(tuple.builder, buildConst(tuple.builder, 3.4)),
					);
				});
				test.test('boxed empty tuple returns `(tuple.make)` containing a BinVect.', () => {
					const src = '((),)';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src);
					return assertEqualBins(
						tuple.build(),
						singletonTuple(tuple.builder, buildConst(tuple.builder, [])),
					);
				});
				test.test('doubly boxed empty tuple returns `(tuple.make)` containing a `(tuple.extract)`.', () => {
					const src = '(((),),)';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src);
					return assertEqualBins(
						tuple.build(),
						singletonTuple(tuple.builder, tuple.builder.module.tuple.extract(singletonTuple(tuple.builder, buildConst(tuple.builder, [])), 0)),
					);
				});
				test.test('boxed tuple with 1 item.', () => {
					const src = '((3.4,),)';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src);
					return assertEqualBins(
						tuple.build(),
						singletonTuple(tuple.builder, tuple.builder.module.tuple.extract(singletonTuple(tuple.builder, buildConst(tuple.builder, 3.4)), 0)),
					);
				});
				test.test('boxed tuple with many items.', () => {
					const tuple: AST.ASTNodeTuple       = AST.ASTNodeTuple.fromSource('((1, 2.0, true),)');
					const mod:   binaryen.Module        = tuple.builder.module;
					const inner: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(tuple.builder, 1n),
						buildConst(tuple.builder, 2.0),
						buildConst(tuple.builder, true),
					]);
					return assertEqualBins(
						tuple.build(),
						mod.tuple.make([
							mod.tuple.extract(mod.local.tee(0, inner, bintype3), 0),
							mod.tuple.extract(mod.local.get(0, bintype3), 1),
							mod.tuple.extract(mod.local.get(0, bintype3), 2),
						]),
					);
				});
				test.test('nested tuples.', () => {
					const tuple:  AST.ASTNodeTuple       = AST.ASTNodeTuple.fromSource('(1, (2.0,), (3, (4.0,)))');
					const bldr:   Builder                = tuple.builder;
					const mod:    binaryen.Module        = bldr.module;
					const inner2: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 3n),
						mod.tuple.extract(singletonTuple(bldr, buildConst(bldr, 4.0)), 0),
					]);
					return assertEqualBins(
						tuple.build(),
						mod.tuple.make([
							buildConst(bldr, 1n),
							mod.tuple.extract(singletonTuple(bldr, buildConst(bldr, 2.0)), 0),
							mod.tuple.extract(mod.local.tee(0, inner2, bintype2), 0),
							mod.tuple.extract(mod.local.get(0, bintype2), 1),
						]),
					);
				});
				test.test('multiple entries.', () => {
					const tuple:   AST.ASTNodeTuple       = AST.ASTNodeTuple.fromSource('((1, (2.0, 3)), (4.0, (5, 6.0)), (7, ()))');
					const bldr:    Builder                = tuple.builder;
					const mod:     binaryen.Module        = bldr.module;
					const inner01: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 2.0),
						buildConst(bldr, 3n),
					]);
					const inner11: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 5n),
						buildConst(bldr, 6.0),
					]);
					const inner2: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 7n),
						buildConst(bldr, []),
					]);
					const inner0: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 1n),
						mod.tuple.extract(mod.local.tee(0, inner01, bintype2), 0),
						mod.tuple.extract(mod.local.get(0, bintype2), 1),
					]);
					const inner1: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 4.0),
						mod.tuple.extract(mod.local.tee(2, inner11, bintype2), 0),
						mod.tuple.extract(mod.local.get(2, bintype2), 1),
					]);
					return assertEqualBins(
						tuple.build(),
						mod.tuple.make([
							mod.tuple.extract(mod.local.tee(1, inner0, bintype3), 0),
							mod.tuple.extract(mod.local.get(1, bintype3), 1),
							mod.tuple.extract(mod.local.get(1, bintype3), 2),
							mod.tuple.extract(mod.local.tee(3, inner1, bintype3), 0),
							mod.tuple.extract(mod.local.get(3, bintype3), 1),
							mod.tuple.extract(mod.local.get(3, bintype3), 2),
							mod.tuple.extract(mod.local.tee(4, inner2, bintype2), 0),
							mod.tuple.extract(mod.local.get(4, bintype2), 1),
						]),
					);
				});
				test.test('pointer entries.', () => {
					const {goal, stmts, mod} = setupScript(`{
						let var inner01: (float, int)   = (2.0, 3);
						let var inner11: (int,   float) = (5,   6.0);
						let var inner2:  (int,   ())    = (7,   ());

						let var inner0: (int,   (float, int))   = (1,   inner01);
						let var inner1: (float, (int,   float)) = (4.0, inner11);

						let tuple: ((int, (float, int)), (float, (int, float)), (int, ())) = (inner0, inner1, inner2);
					}`);
					return assertEqualBins(
						stmts.map((stmt) => (stmt as AST.ASTNodeDeclarationVariable).assigned!.build()),
						[
							mod.tuple.make([buildConst(goal.builder, 2.0), buildConst(goal.builder, 3n)]),
							mod.tuple.make([buildConst(goal.builder, 5n),  buildConst(goal.builder, 6.0)]),
							mod.tuple.make([buildConst(goal.builder, 7n),  buildConst(goal.builder, [])]),
							mod.tuple.make([
								buildConst(goal.builder, 1n),
								mod.tuple.extract(mod.local.get(0, bintype2), 0),
								mod.tuple.extract(mod.local.get(0, bintype2), 1),
							]),
							mod.tuple.make([
								buildConst(goal.builder, 4.0),
								mod.tuple.extract(mod.local.get(1, bintype2), 0),
								mod.tuple.extract(mod.local.get(1, bintype2), 1),
							]),
							mod.tuple.make([
								mod.tuple.extract(mod.local.get(3, bintype3), 0),
								mod.tuple.extract(mod.local.get(3, bintype3), 1),
								mod.tuple.extract(mod.local.get(3, bintype3), 2),
								mod.tuple.extract(mod.local.get(4, bintype3), 0),
								mod.tuple.extract(mod.local.get(4, bintype3), 1),
								mod.tuple.extract(mod.local.get(4, bintype3), 2),
								mod.tuple.extract(mod.local.get(2, bintype2), 0),
								mod.tuple.extract(mod.local.get(2, bintype2), 1),
							]),
						],
					);
				});
			});

			test.suite('ASTNodeRecord', () => {
				test.test('returns `(tuple.make)`.', () => {
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource('(a= 1, b= 2.0)');
					return assertEqualBins(
						record.build(),
						record.builder.module.tuple.make([buildConst(record.builder, 1n), buildConst(record.builder, 2.0)]),
					);
				});
				test.test('returns a `(block)` with `(set)`s followed by a `(tuple.make)` with `(get)`s if source order differs from key order.', () => {
					const {goal, stmts, mod} = setupScript(`{
						(a= 1, b= 2.0);
						(b= 2.0, a= 1);
					}`);
					return assertEqualBins(
						stmts.map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.build()),
						[
							mod.tuple.make([
								buildConst(goal.builder, 1n),
								buildConst(goal.builder, 2.0),
							]),
							mod.block(null, [
								mod.local.set(0, buildConst(goal.builder, 2.0)),
								mod.local.set(1, buildConst(goal.builder, 1n)),
								mod.tuple.make([
									mod.local.get(1, binaryen.v128),
									mod.local.get(0, binaryen.v128),
								]),
							], bintype2),
						],
					);
				});
				test.test('record of size 1 returns a `(tuple.make)` with 1 item.', () => {
					const src = '(a= 3.4)';
					testModuleValidation(src);
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource(src);
					return assertEqualBins(
						record.build(),
						singletonTuple(record.builder, buildConst(record.builder, 3.4)),
					);
				});
				test.test('boxed record with 1 prop.', () => {
					const src = '(a= (a= 3.4))';
					testModuleValidation(src);
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource(src);
					return assertEqualBins(
						record.build(),
						singletonTuple(record.builder, record.builder.module.tuple.extract(singletonTuple(record.builder, buildConst(record.builder, 3.4)), 0)),
					);
				});
				test.test('boxed record with many props.', () => {
					const record: AST.ASTNodeRecord      = AST.ASTNodeRecord.fromSource('(a= (a= 1, b= 2.0, c= true))');
					const mod:    binaryen.Module        = record.builder.module;
					const inner:  binaryen.ExpressionRef = mod.tuple.make([
						buildConst(record.builder, 1n),
						buildConst(record.builder, 2.0),
						buildConst(record.builder, true),
					]);
					return assertEqualBins(
						record.build(),
						mod.tuple.make([
							mod.tuple.extract(mod.local.tee(0, inner, bintype3), 0),
							mod.tuple.extract(mod.local.get(0, bintype3), 1),
							mod.tuple.extract(mod.local.get(0, bintype3), 2),
						]),
					);
				});
				test.test('nested records.', () => {
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource(`(
						a= 1,
						b= (a= 2.0),
						c= (a= 3, b= (a= 4.0)),
					)`);
					const bldr:   Builder                = record.builder;
					const mod:    binaryen.Module        = bldr.module;
					const inner2: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 3n),
						mod.tuple.extract(singletonTuple(bldr, buildConst(bldr, 4.0)), 0),
					]);
					return assertEqualBins(
						record.build(),
						mod.tuple.make([
							buildConst(bldr, 1n),
							mod.tuple.extract(singletonTuple(bldr, buildConst(bldr, 2.0)), 0),
							mod.tuple.extract(mod.local.tee(0, inner2, bintype2), 0),
							mod.tuple.extract(mod.local.get(0, bintype2), 1),
						]),
					);
				});
				test.test('multiple entries.', () => {
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource(`(
						a= (a= 1,   b= (a= 2.0, b= 3)),
						b= (a= 4.0, b= (a= 5, b= 6.0)),
						c= (b= 7,   a= true),
					)`);
					const bldr:    Builder                = record.builder;
					const mod:     binaryen.Module        = bldr.module;
					const inner01: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 2.0),
						buildConst(bldr, 3n),
					]);
					const inner11: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 5n),
						buildConst(bldr, 6.0),
					]);
					const inner0: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 1n),
						mod.tuple.extract(mod.local.tee(0, inner01, bintype2), 0),
						mod.tuple.extract(mod.local.get(0, bintype2), 1),
					]);
					const inner1: binaryen.ExpressionRef = mod.tuple.make([
						buildConst(bldr, 4.0),
						mod.tuple.extract(mod.local.tee(2, inner11, bintype2), 0),
						mod.tuple.extract(mod.local.get(2, bintype2), 1),
					]);
					const inner2: binaryen.ExpressionRef = mod.block(null, [
						mod.local.set(4, buildConst(bldr, 7n)),
						mod.local.set(5, buildConst(bldr, true)),
						mod.tuple.make([
							mod.local.get(5, binaryen.v128),
							mod.local.get(4, binaryen.v128),
						]),
					], bintype2);
					return assertEqualBins(
						record.build(),
						mod.tuple.make([
							mod.tuple.extract(mod.local.tee(1, inner0, bintype3), 0),
							mod.tuple.extract(mod.local.get(1, bintype3), 1),
							mod.tuple.extract(mod.local.get(1, bintype3), 2),
							mod.tuple.extract(mod.local.tee(3, inner1, bintype3), 0),
							mod.tuple.extract(mod.local.get(3, bintype3), 1),
							mod.tuple.extract(mod.local.get(3, bintype3), 2),
							mod.tuple.extract(mod.local.tee(6, inner2, bintype2), 0),
							mod.tuple.extract(mod.local.get(6, bintype2), 1),
						]),
					);
				});
				test.test('pointer entries.', () => {
					const {goal, stmts, mod} = setupScript(`{
						let var inner_ab: (a: float, b: int)   = (a= 2.0, b= 3);
						let var inner_bb: (a: int,   b: float) = (a= 5,   b= 6.0);
						let var inner_c:  (b: int,   a: bool)  = (b= 7,   a= true);

						let var inner_a: (a: int,   b: (a: float, b: int))   = (a= 1,   b= inner_ab);
						let var inner_b: (a: float, b: (a: int,   b: float)) = (a= 4.0, b= inner_bb);

						let record: (
							a: (a: int,   b: (a: float, b: int)),
							b: (a: float, b: (a: int,   b: float)),
							c: (b: int,   a: bool),
						) = (a= inner_a, b= inner_b, c= inner_c);
					}`);
					return assertEqualBins(
						stmts.map((stmt) => (stmt as AST.ASTNodeDeclarationVariable).assigned!.build()),
						[
							mod.tuple.make([buildConst(goal.builder, 2.0), buildConst(goal.builder, 3n)]),
							mod.tuple.make([buildConst(goal.builder, 5n),  buildConst(goal.builder, 6.0)]),
							mod.block(null, [
								mod.local.set(2, buildConst(goal.builder, 7n)),
								mod.local.set(3, buildConst(goal.builder, true)),
								mod.tuple.make([
									mod.local.get(3, binaryen.v128),
									mod.local.get(2, binaryen.v128),
								]),
							], bintype2),
							mod.tuple.make([
								buildConst(goal.builder, 1n),
								mod.tuple.extract(mod.local.get(0, bintype2), 0),
								mod.tuple.extract(mod.local.get(0, bintype2), 1),
							]),
							mod.tuple.make([
								buildConst(goal.builder, 4.0),
								mod.tuple.extract(mod.local.get(1, bintype2), 0),
								mod.tuple.extract(mod.local.get(1, bintype2), 1),
							]),
							mod.tuple.make([
								mod.tuple.extract(mod.local.get(5, bintype3), 0),
								mod.tuple.extract(mod.local.get(5, bintype3), 1),
								mod.tuple.extract(mod.local.get(5, bintype3), 2),
								mod.tuple.extract(mod.local.get(6, bintype3), 0),
								mod.tuple.extract(mod.local.get(6, bintype3), 1),
								mod.tuple.extract(mod.local.get(6, bintype3), 2),
								mod.tuple.extract(mod.local.get(4, bintype2), 0),
								mod.tuple.extract(mod.local.get(4, bintype2), 1),
							]),
						],
					);
				});
			});
		});
	});



	test.suite('ASTNodeClaim', () => {
		const samples: string[] = [
			'null',
			'false',
			'true',
			'0',
			'+0',
			'-0',
			'42',
			'+42',
			'-42',
			'0.0',
			'+0.0',
			'-0.0',
			'-4.2e-2',
		];


		test.suite('#type', () => {
			test.test('returns the type value of the claimed type.', () => {
				assert.ok(AST.ASTNodeClaim.fromSource('3 as <int?>').type().equals(TYPE.INT.union(TYPE.NULL)));
			});
			test.test('allows claiming to `nothing` even though intersection is empty.', () => {
				assert.ok(AST.ASTNodeClaim.fromSource('42 as <nothing>').type().isBottomType);
			});
			test.test('allows claiming a `nothing` expression even though intersection is empty.', () => {
				const claim: AST.ASTNodeClaim = AST.ASTNodeClaim.fromSource('n as <int>');
				claim.validator.addSymbol(new SymbolSchemaVar(claim.operand as AST.ASTNodeVariable, false, false));
				(claim.validator.getSymbolInfo(0x100n) as SymbolSchemaVar).type = TYPE.NOTHING;
				assert.strictEqual(claim.type(), TYPE.INT);
			});
			test.test('allows claiming to a type alias.', () => {
				const claim: AST.ASTNodeClaim = AST.ASTNodeClaim.fromSource('"Alice" as <Name>');
				claim.validator.addSymbol(new SymbolSchemaType(claim.claimed_type as AST.ASTNodeTypeAlias));
				(claim.validator.getSymbolInfo(0x100n) as SymbolSchemaType).typevalue = TYPE.STR;
				assert.strictEqual(claim.type(), TYPE.STR);
			});
			test.test('throws when the operand type and claimed type do not overlap (and neither is `nothing`).', () => {
				assert.throws(() => AST.ASTNodeClaim.fromSource('3 as <str>')      .type(), TypeErrorNotAssignable);
				assert.throws(() => AST.ASTNodeClaim.fromSource('"three" as <int>').type(), TypeErrorNotAssignable);
				assert.throws(() => AST.ASTNodeClaim.fromSource('3 as <float>')    .type(), TypeErrorNotAssignable);
				assert.throws(() => AST.ASTNodeClaim.fromSource('3.0 as <int>')    .type(), TypeErrorNotAssignable);
			});
		});


		test.suite('#fold', () => {
			test.test('returns the fold of the operand.', () => {
				samples.forEach((expr) => assert.deepStrictEqual(
					AST.ASTNodeClaim     .fromSource(`${ expr } as <anything>`) .fold(),
					AST.ASTNodeExpression.fromSource(expr).fold(),
					expr,
				));
			});
		});


		test.suite('#build', () => {
			test.test('returns the build of the operand.', () => {
				samples.forEach((expr) => assertEqualBins(
					AST.ASTNodeClaim     .fromSource(`${ expr } as <anything>`).build(),
					AST.ASTNodeExpression.fromSource(expr).build(),
				));
			});
		});
	});



	test.suite('ASTNodeExpressionBlock', () => {
		test.suite('#type', () => {
			test.test('throws when the last statement is not an expression-statement.', () => {
				const {goal} = setupScript(`{
					let var x: int = 42;
					let var y: int | null = {
						x;
						let var z: int = 69;
						%> Error!
					};
					x;
					y;
				}`, null, {typeCheck: false});
				assert.throws(() => goal.typeCheck(), /The last statement of a block-expression must be an expression-statement/);
			});
			test.test('throws when the determinant is empty.', () => {
				const {goal} = setupScript(`{
					let var x: int = 42;
					let var y: int | null = {
						x;
						let var z: int = 69;
						; %> Error!
					};
					x;
					y;
				}`, null, {typeCheck: false});
				assert.throws(() => goal.typeCheck(), /The determining expression-statement of a block-expression must be nonempty/);
			});
			test.test('returns the type of the determinant.', () => {
				const {stmts} = setupScript(`{
					let var x: int = 42;
					let var y: int | null = {
						x;
						let var z: int = 69;
						z; % type \`int\`
					};
					x;
					y;
				}`, null, {build: false});
				assertEqualTypes((stmts[1] as AST.ASTNodeDeclarationVariable).assigned!.type(), TYPE.INT);
			});
		});


		test.suite('#fold', () => {
			test.test('returns null if the block is not foldable.', () => {
				assert.strictEqual(((setupScript(`{
					let var x: int = 42;
					let z: int = 69;
					let var y: int | null = {
						x;
						z;
					};
					x;
					y;
				}`, null, {build: false}).stmts[2] as AST.ASTNodeDeclarationVariable).assigned as AST.ASTNodeExpressionBlock).fold(), null);
			});
			test.test('returns the folded value of the last statement, provided the block is foldable.', () => {
				const {stmts} = setupScript(`{
					let x: int = 42;
					let z: int = 69;
					let y: int | null = {
						x;
						let w: int = x;
						w;
						;
						z;
					};
					x;
					y;
				}`, null, {build: false});
				const block_expression = (stmts[2] as AST.ASTNodeDeclarationVariable).assigned as AST.ASTNodeExpressionBlock;
				assert.strictEqual(
					block_expression.fold(),
					(block_expression.block.children.at(-1) as AST.ASTNodeStatementExpression).expr!.fold(),
				);
				return assert.deepStrictEqual(
					(stmts[4] as AST.ASTNodeStatementExpression).expr!.fold(),
					new VALUE.Integer(69n),
				);
			});
			test.test('sanity check.', () => {
				assert.deepStrictEqual(
					(setupScript(`{
						let x: int = 42 - { 42; 69; };
						x;
					}`, null, {build: false}).stmts[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					new VALUE.Integer(42n - 69n),
				);
			});
		});


		test.suite('#build', () => {
			test.test('builds each statement except last as usual, then outputs last expression-statement build.', () => {
				const {goal, stmts, mod} = setupScript(`{
					let var x: int = 42;
					let var y: int | null = {
						x;
						let var z: int = 69;
						z;
					};
					x;
					y;
				}`);
				return assertEqualBins((stmts[1] as AST.ASTNodeDeclarationVariable).assigned!.build(), mod.block(null, [
					mod.drop(mod.local.get(0, binaryen.v128)),
					mod.local.set(1, buildConst(goal.builder, 69n)),
					mod.local.get(1, binaryen.v128),
				], binaryen.v128));
			});
		});
	});
});
