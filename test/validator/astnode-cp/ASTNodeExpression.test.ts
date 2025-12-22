import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	VALUE,
	TYPE,
	type Builder,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateKey,
} from '../../../src/index.ts';
import {
	assertEqualTypes,
	assertEqualBins,
	assertAssignable,
} from '../../assert-helpers.ts';
import {
	CONFIG_FOLDING_OFF,
	typeUnit,
	buildConst,
	singletonTuple,
} from '../../helpers.ts';
import {extract_tokens} from '../../utils.ts';



describe('ASTNodeExpression', () => {
	describe('ASTNodeConstant', () => {
		describe('#varCheck', () => {
			it('never throws.', () => {
				AST.ASTNodeConstant.fromSource('42;').varCheck();
			});
		});


		describe('#type', () => {
			it('returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
				const constants: AST.ASTNodeConstant[] = extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
					55  -55  033  -033  0  -0
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					"42😀"  "42\\u{1f600}"
				`).map((src) => AST.ASTNodeConstant.fromSource(`${ src };`));
				return assertEqualTypes(
					constants.map((c) => c.type()),
					constants.map((c) => new TYPE.Unit(c.fold())),
				);
			});
		});


		/* eslint-disable @stylistic/array-element-newline */
		describe('#fold', () => {
			it('computes null, boolean, and symbol values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					null  false  true
					@then  @str  @false  @foobar
				`).map((src) => AST.ASTNodeConstant.fromSource(`${ src };`).fold()), [
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
					new VALUE.Symbol(0x8en,  'then'),
					new VALUE.Symbol(0x85n,  'str'),
					new VALUE.Symbol(0x88n,  'false'),
					new VALUE.Symbol(0x100n, 'foobar'),
				]);
			});
			it('computes int values.', () => {
				const integer_radices_on: CPConfig = {
					...CONFIG_DEFAULT,
					languageFeatures: {
						...CONFIG_DEFAULT.languageFeatures,
						integerRadices: true,
					},
				};
				assert.deepStrictEqual(extract_tokens(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`).map((src) => AST.ASTNodeConstant.fromSource(`${ src };`, integer_radices_on).fold()), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new VALUE.Integer(BigInt(v))));
			});
			it('computes float values.', () => {
				assert.deepStrictEqual(extract_tokens(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`).map((src) => AST.ASTNodeConstant.fromSource(`${ src };`).fold()), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new VALUE.Float(v)));
			});
			it('computes string values.', () => {
				assertEqualTypes(
					AST.ASTNodeConstant.fromSource('"42😀\\u{1f600}";').type(),
					typeUnit('42😀\u{1f600}'),
				);
			});
		});
		/* eslint-enable @stylistic/array-element-newline */


		specify('#build', () => {
			xjs.Map.forEachAggregated(new Map<string, (builder: Builder) => binaryen.ExpressionRef>([
				['null;',    (builder) => buildConst(builder)],
				['false;',   (builder) => buildConst(builder, false)],
				['true;',    (builder) => buildConst(builder, true)],
				['@never;',  (builder) => buildConst(builder, Symbol(0x80))],
				['@hello;',  (builder) => buildConst(builder, Symbol(0x100))],
				['0;',       (builder) => buildConst(builder, 0n)],
				['+0;',      (builder) => buildConst(builder, 0n)],
				['-0;',      (builder) => buildConst(builder, 0n)],
				['42;',      (builder) => buildConst(builder, 42n)],
				['+42;',     (builder) => buildConst(builder, 42n)],
				['-42;',     (builder) => buildConst(builder, -42n)],
				['0.0;',     (builder) => buildConst(builder, 0)],
				['+0.0;',    (builder) => buildConst(builder, 0)],
				['-0.0;',    (builder) => buildConst(builder, -0)],
				['-4.2e-2;', (builder) => buildConst(builder, -0.042)],
			]), (expected_fn, src) => {
				const constant: AST.ASTNodeConstant = AST.ASTNodeConstant.fromSource(src, CONFIG_FOLDING_OFF);
				return assertEqualBins(
					constant.build(),
					expected_fn.call(null, constant.builder),
				);
			});
		});
	});



	describe('ASTNodeVariable', () => {
		describe('#varCheck', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`
					val mut i: int = 42;
					i;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource('i;').varCheck(), ReferenceErrorUndeclared);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					i;
					val mut i: int = 42;
				`).varCheck(), ReferenceErrorDeadZone);
			});
			it('throws if it was declared as a type alias.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type FOO = int;
					42 || FOO;
				`).varCheck(), ReferenceErrorKind);
			});
		});


		describe('#type', () => {
			it('unions with `null` when accessed variable is uninitialized.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut w:  int = 42;
					val mut x?: int;
					w;
					x;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok( (goal.children[0] as AST.ASTNodeDeclarationVariable).assigned);
				assert.ok(!(goal.children[1] as AST.ASTNodeDeclarationVariable).assigned);
				return assertEqualTypes(
					goal.children.slice(2).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.type()),
					[
						TYPE.INT,
						TYPE.INT.union(TYPE.NULL),
					],
				);
			});
		});


		describe('#fold', () => {
			it('assesses the value of a fixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val x: int = 21 * 2;
					x;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok(!(goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					new VALUE.Integer(42n),
				);
			});
			it('returns null for an unfixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int = 21 * 2;
					x;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok((goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			it('returns null for a fixed variable of mutable type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val fixed_mutable: mut {int} = {1, 2, 3};
					fixed_mutable;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok((goal.children[0] as AST.ASTNodeDeclarationVariable).typenode.eval().hasMutable);
				assert.deepStrictEqual(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			it('returns null for an uncomputable fixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int = 21 * 2;
					val y: int = x / 2;
					y;
					val z: mut {int} = {11, 22, 33};
					val w: bool = z.[22];
					w;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok(!(goal.children[1] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.ok(!(goal.children[4] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					[
						(goal.children[2] as AST.ASTNodeStatementExpression).expr!.fold(),
						(goal.children[5] as AST.ASTNodeStatementExpression).expr!.fold(),
					],
					[null, null],
				);
			});
		});


		describe('#build', () => {
			it('with constant folding on, returns `({i32,f64}.const)` for fixed & foldable variables.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val x: int = 42;
					val y: float = 4.2 * 10;
					x;
					y;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				assertEqualBins(
					[
						(goal.children[2] as AST.ASTNodeStatementExpression).expr!.build(),
						(goal.children[3] as AST.ASTNodeStatementExpression).expr!.build(),
					],
					[
						buildConst(goal.builder, 42n),
						buildConst(goal.builder, 42.0),
					],
				);
			});
			it('with constant folding on, returns `(local.get)` for unfixed / non-foldable variables.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int = 42;
					val y: int = x + 10;
					x;
					y;
				`);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const var0 = (goal.children[2] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const var1 = (goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const [
					{id: id0, type: type0},
					{id: id1, type: type1},
				] = goal.builder.getLocals();
				assert.deepStrictEqual([var0.id, var1.id], [id0, id1]);
				assertEqualBins(
					[
						var0.build(),
						var1.build(),
					],
					[
						goal.builder.module.local.get(0, type0),
						goal.builder.module.local.get(1, type1),
					],
				);
			});
			it('with constant folding off, always returns `(local.get)`.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val x: int = 42;
					val mut y: float = 4.2;
					x;
					y;
				`, CONFIG_FOLDING_OFF);
				goal.varCheck();
				goal.typeCheck();
				goal.build();
				const var0 = (goal.children[2] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const var1 = (goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeVariable;
				const [
					{id: id0, type: type0},
					{id: id1, type: type1},
				] = goal.builder.getLocals();
				assert.deepStrictEqual([var0.id, var1.id], [id0, id1]);
				assertEqualBins(
					[
						var0.build(),
						var1.build(),
					],
					[
						goal.builder.module.local.get(0, type0),
						goal.builder.module.local.get(1, type1),
					],
				);
			});
		});
	});



	describe('ASTNodeTemplate', () => {
		function initTemplates(config: CPConfig = CONFIG_DEFAULT): AST.ASTNodeTemplate[] {
			const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
				val mut x: int = 21;
				"""the answer is {{ x * 2 }} but what is the question?""";
			`, config);
			goal.varCheck();
			goal.typeCheck();
			return [
				AST.ASTNodeTemplate.fromSource('"""42😀""";', config),
				AST.ASTNodeTemplate.fromSource('"""the answer is {{ 7 * 3 * 2 }} but what is the question?""";', config),
				(goal.children[1] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTemplate,
			];
		}
		describe('#type', () => {
			let templates: readonly AST.ASTNodeTemplate[] = [];
			context('with constant folding on.', () => {
				let types: TYPE.Type[] = [];
				before(() => {
					templates = initTemplates();
					types = templates.map((t) => t.type());
				});
				it('for foldable interpolations, returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
					assertEqualTypes(
						types.slice(0, 2),
						templates.slice(0, 2).map((t) => new TYPE.Unit<VALUE.String>(t.fold()!)),
					);
				});
				it('for non-foldable interpolations, returns `String`.', () => {
					assert.strictEqual(types[2], TYPE.STR);
				});
			});
			context('with constant folding off.', () => {
				it('always returns `String`.', () => {
					templates = initTemplates(CONFIG_FOLDING_OFF);
					return templates.forEach((t) => assert.strictEqual(t.type(), TYPE.STR));
				});
			});
		});


		describe('#fold', () => {
			let templates: AST.ASTNodeTemplate[] = [];
			before(() => {
				templates = initTemplates();
			});
			it('returns a constant String for ASTNodeTemplate with no interpolations.', () => {
				assert.deepStrictEqual(
					templates[0].fold(),
					new VALUE.String('42😀'),
				);
			});
			it('returns a constant String for ASTNodeTemplate with foldable interpolations.', () => {
				assert.deepStrictEqual(
					templates[1].fold(),
					new VALUE.String('the answer is 42 but what is the question?'),
				);
			});
			it('returns null for ASTNodeTemplate with dynamic interpolations.', () => {
				assert.deepStrictEqual(
					templates[2].fold(),
					null,
				);
			});
		});
	});



	describe('ASTNodeCollectionLiteral', () => {
		describe('#varCheck', () => {
			describe('ASTNode{{Type}Record,Dict}', () => {
				it('var-checks all keys before all values.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						type T = str;
						type U = (a: bool, b: (z: int), c: T, d: (y: float));
						val f: null = null;
						(e= [x= 42, w= 4.2], f= f);
						[g= (w= 42, x= 4.2), f= f];
					`);
					goal.varCheck();
					goal.typeCheck();
					assert.partialDeepStrictEqual(
						goal.validator.getSymbols(),
						new Map([
							[0x100n, {source: 'T'}],
							[0x107n, {source: 'U'}],
							[0x108n, {source: 'f'}],
						]),
					);
					assertEqualTypes(
						(goal.children[1] as AST.ASTNodeDeclarationType).assigned.eval(),
						TYPE.Record.fromTypes(new Map([
							[0x101n, TYPE.BOOL],
							[0x102n, TYPE.Record.fromTypes(new Map([[0x105n, TYPE.INT]]))],
							[0x103n, TYPE.STR],
							[0x104n, TYPE.Record.fromTypes(new Map([[0x106n, TYPE.FLOAT]]))],
						])),
					);
					return assert.deepStrictEqual(goal.children.slice(3, 5).map((stmt) => (stmt as AST.ASTNodeStatementExpression).expr!.fold()), [
						new VALUE.Record(new Map<bigint, VALUE.Value>([
							[0x109n, new VALUE.Dict(new Map<bigint, VALUE.Value>([
								[0x10an, new VALUE.Integer(42n)],
								[0x10bn, new VALUE.Float(4.2)],
							]))],
							[0x108n, VALUE.NULL],
						])),
						new VALUE.Dict(new Map<bigint, VALUE.Value>([
							[0x10cn, new VALUE.Record(new Map<bigint, VALUE.Value>([
								[0x10bn, new VALUE.Integer(42n)],
								[0x10an, new VALUE.Float(4.2)],
							]))],
							[0x108n, VALUE.NULL],
						])),
					]);
				});
				it('throws if containing duplicate keys.', () => {
					[
						AST.ASTNodeTypeRecord .fromSource('(a: int, b: float, c: str)'),
						AST.ASTNodeRecord     .fromSource('(a= 1, b= 2.0, c= "three");'),
						AST.ASTNodeDict       .fromSource('[a= 1, b= 2.0, c= "three"];'),
					].forEach((node) => node.varCheck()); // assert does not throw

					[
						AST.ASTNodeTypeRecord .fromSource('(a: int, b: float, a: str)'),
						AST.ASTNodeTypeRecord .fromSource('(_: int, b: float, _: str)'),
						AST.ASTNodeRecord     .fromSource('(a= 1, b= 2.0, a= "three");'),
						AST.ASTNodeRecord     .fromSource('(_= 1, b= 2.0, _= "three");'),
						AST.ASTNodeDict       .fromSource('[a= 1, b= 2.0, a= "three"];'),
						AST.ASTNodeDict       .fromSource('[_= 1, b= 2.0, _= "three"];'),
					].forEach((node) => assert.throws(() => node.varCheck(), AssignmentErrorDuplicateKey));

					new Map<AST.ASTNodeCP, string[]>([
						[AST.ASTNodeTypeRecord .fromSource('(c: int, d: float, c: str, d: bool)'),   ['c', 'd']],
						[AST.ASTNodeTypeRecord .fromSource('(e: int, f: float, e: str, e: bool)'),   ['e', 'e']],
						[AST.ASTNodeRecord     .fromSource('(c= 1, d= 2.0, c= "three", d= false);'), ['c', 'd']],
						[AST.ASTNodeRecord     .fromSource('(e= 1, f= 2.0, e= "three", e= false);'), ['e', 'e']],
						[AST.ASTNodeDict       .fromSource('[c= 1, d= 2.0, c= "three", d= false];'), ['c', 'd']],
						[AST.ASTNodeDict       .fromSource('[e= 1, f= 2.0, e= "three", e= false];'), ['e', 'e']],
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


		describe('#type', () => {
			([
				['with constant folding on.',  CONFIG_DEFAULT,     TYPE.Union.all([typeUnit('a'), typeUnit(42n), typeUnit(3.0)])],
				['with constant folding off.', CONFIG_FOLDING_OFF, TYPE.Union.all([typeUnit('a'), TYPE.INT,      TYPE.FLOAT])],
			] as const).forEach(([description, config, map_ant_type]) => it(description, () => {
				const expected: readonly TYPE.Unit[] = [typeUnit(1n), typeUnit(2.0), typeUnit('three')];
				const collections: readonly [
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeSet,
					AST.ASTNodeMap,
				] = [
					AST.ASTNodeTuple  .fromSource('(   1,    2.0,    "three");', config),
					AST.ASTNodeRecord .fromSource('(a= 1, b= 2.0, _= "three");', config),
					AST.ASTNodeSet    .fromSource('{   1,    2.0,    "three"};', config),
					AST.ASTNodeMap.fromSource(`
						{
							"a" || "" -> 1,
							21 + 21   -> 2.0,
							3 * 1.0   -> "three",
						};
					`, config),
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
							map_ant_type,
							TYPE.Union.all(expected),
							true,
						),
					],
				);
			}));
			it('does not throw if value type contains reference type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					(   1,    [2.2],    "three");
					(a= 1, b= [2.2], c= "three");
				`);
				goal.varCheck();
				goal.typeCheck(); // assert does not throw
			});
		});


		describe('#fold', () => {
			it('returns Tuple/Record for constant collections.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple  .fromSource('(   1,    2.0,    "three");'),
						AST.ASTNodeRecord .fromSource('(a= 1, b= 2.0, c= "three");'),
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
			it('returns a constant List/Dict/Set/Map for foldable entries.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeList.fromSource('[1, 2.0, "three"];'),
						AST.ASTNodeDict.fromSource('[a= 1, b= 2.0, c= "three"];'),
						AST.ASTNodeSet.fromSource('{1, 2.0, "three"};'),
						AST.ASTNodeMap.fromSource(`
							{
								"a" || "" -> 1,
								21 + 21   -> 2.0,
								3 * 1.0   -> "three",
							};
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
			it('returns null for non-foldable entries.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					val mut x: int   = 1;
					val mut y: float = 2.0;
					val mut z: str   = "three";
					(x, 2.0, "three");
					(a= 1, b= y, c= "three");
					[x, 2.0, "three"];
					[a= 1, b= y, c= "three"];
					{1, 2.0, z};
					{
						"a" || "" -> 1,
						21 + 21   -> 2.0,
						3 * 1.0   -> z,
					};
				`);
				goal.varCheck();
				goal.typeCheck();
				xjs.Array.forEachAggregated(goal.children.slice(3), (c) => assert.strictEqual((c as AST.ASTNodeStatementExpression).expr!.fold(), null));
			});
		});


		describe('#build', () => {
			const bintype2: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128]);
			const bintype3: binaryen.Type = binaryen.createType([binaryen.v128, binaryen.v128, binaryen.v128]);

			function testModuleValidation(src: string): void {
				const goal = AST.ASTNodeGoal.fromSource(src, CONFIG_FOLDING_OFF);
				goal.varCheck();
				goal.typeCheck();
				goal.build(); // assert does not throw
			}

			describe('ASTNodeTuple', () => {
				it('returns `(tuple.make)`.', () => {
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource('(1, 2.0);', CONFIG_FOLDING_OFF);
					return assertEqualBins(
						tuple.build(),
						tuple.builder.module.tuple.make([buildConst(tuple.builder, 1n), buildConst(tuple.builder, 2.0)]),
					);
				});
				it('empty tuple returns unique BinVect representation.', () => {
					const src = '();';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src, CONFIG_FOLDING_OFF);
					return assertEqualBins(
						tuple.build(),
						buildConst(tuple.builder, []),
					);
				});
				it('tuple of length 1 returns a `(tuple.make)` with 1 item.', () => {
					const src = '(3.4,);';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src, CONFIG_FOLDING_OFF);
					return assertEqualBins(
						tuple.build(),
						singletonTuple(tuple.builder, buildConst(tuple.builder, 3.4)),
					);
				});
				it('boxed empty tuple returns `(tuple.make)` containing a BinVect.', () => {
					const src = '((),);';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src, CONFIG_FOLDING_OFF);
					return assertEqualBins(
						tuple.build(),
						singletonTuple(tuple.builder, buildConst(tuple.builder, [])),
					);
				});
				it('doubly boxed empty tuple returns `(tuple.make)` containing a `(tuple.extract)`.', () => {
					const src = '(((),),);';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src, CONFIG_FOLDING_OFF);
					return assertEqualBins(
						tuple.build(),
						singletonTuple(tuple.builder, tuple.builder.module.tuple.extract(singletonTuple(tuple.builder, buildConst(tuple.builder, [])), 0)),
					);
				});
				it('boxed tuple with 1 item.', () => {
					const src = '((3.4,),);';
					testModuleValidation(src);
					const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource(src, CONFIG_FOLDING_OFF);
					return assertEqualBins(
						tuple.build(),
						singletonTuple(tuple.builder, tuple.builder.module.tuple.extract(singletonTuple(tuple.builder, buildConst(tuple.builder, 3.4)), 0)),
					);
				});
				it('boxed tuple with many items.', () => {
					const tuple: AST.ASTNodeTuple       = AST.ASTNodeTuple.fromSource('((1, 2.0, true),);', CONFIG_FOLDING_OFF);
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
				it('nested tuples.', () => {
					const tuple:  AST.ASTNodeTuple       = AST.ASTNodeTuple.fromSource('(1, (2.0,), (3, (4.0,)));', CONFIG_FOLDING_OFF);
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
				it('multiple entries.', () => {
					const tuple:   AST.ASTNodeTuple       = AST.ASTNodeTuple.fromSource('((1, (2.0, 3)), (4.0, (5, 6.0)), (7, ()));', CONFIG_FOLDING_OFF);
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
				it('pointer entries.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						val inner01: (float, int)   = (2.0, 3);
						val inner11: (int,   float) = (5,   6.0);
						val inner2:  (int,   ())    = (7,   ());

						val inner0: (int,   (float, int))   = (1,   inner01);
						val inner1: (float, (int,   float)) = (4.0, inner11);

						val tuple: ((int, (float, int)), (float, (int, float)), (int, ())) = (inner0, inner1, inner2);
					`, CONFIG_FOLDING_OFF);
					goal.varCheck();
					goal.typeCheck();
					goal.build();

					const mod: binaryen.Module = goal.builder.module;
					return assertEqualBins(
						(goal.children as AST.ASTNodeDeclarationVariable[]).map((stmt) => stmt.assigned!.build()),
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

			describe('ASTNodeRecord', () => {
				it('returns `(tuple.make)`.', () => {
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource('(a= 1, b= 2.0);', CONFIG_FOLDING_OFF);
					return assertEqualBins(
						record.build(),
						record.builder.module.tuple.make([buildConst(record.builder, 1n), buildConst(record.builder, 2.0)]),
					);
				});
				it('returns a `(block)` with `(set)`s followed by a `(tuple.make)` with `(get)`s if source order differs from key order.', () => {
					const goal = AST.ASTNodeGoal.fromSource(`
						(a= 1, b= 2.0);
						(b= 2.0, a= 1);
					`, CONFIG_FOLDING_OFF);
					goal.varCheck();
					goal.typeCheck();
					goal.build();
					const bldr: Builder         = goal.builder;
					const mod:  binaryen.Module = bldr.module;
					return assertEqualBins(
						goal.children.map((stmt) => stmt.build()),
						[
							mod.tuple.make([
								buildConst(bldr, 1n),
								buildConst(bldr, 2.0),
							]),
							mod.block(null, [
								mod.local.set(0, buildConst(bldr, 2.0)),
								mod.local.set(1, buildConst(bldr, 1n)),
								mod.tuple.make([
									mod.local.get(1, binaryen.v128),
									mod.local.get(0, binaryen.v128),
								]),
							], bintype2),
						].map((expected) => mod.drop(expected)),
					);
				});
				it('record of size 1 returns a `(tuple.make)` with 1 item.', () => {
					const src = '(a= 3.4);';
					testModuleValidation(src);
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource(src, CONFIG_FOLDING_OFF);
					return assertEqualBins(
						record.build(),
						singletonTuple(record.builder, buildConst(record.builder, 3.4)),
					);
				});
				it('boxed record with 1 prop.', () => {
					const src = '(a= (a= 3.4));';
					testModuleValidation(src);
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource(src, CONFIG_FOLDING_OFF);
					return assertEqualBins(
						record.build(),
						singletonTuple(record.builder, record.builder.module.tuple.extract(singletonTuple(record.builder, buildConst(record.builder, 3.4)), 0)),
					);
				});
				it('boxed record with many props.', () => {
					const record: AST.ASTNodeRecord      = AST.ASTNodeRecord.fromSource('(a= (a= 1, b= 2.0, c= true));', CONFIG_FOLDING_OFF);
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
				it('nested records.', () => {
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource(`(
						a= 1,
						b= (a= 2.0),
						c= (a= 3, b= (a= 4.0)),
					);`, CONFIG_FOLDING_OFF);
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
				it('multiple entries.', () => {
					const record: AST.ASTNodeRecord = AST.ASTNodeRecord.fromSource(`(
						a= (a= 1,   b= (a= 2.0, b= 3)),
						b= (a= 4.0, b= (a= 5, b= 6.0)),
						c= (b= 7,   a= true),
					);`, CONFIG_FOLDING_OFF);
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
				it('pointer entries.', () => {
					const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
						val inner_ab: (a: float, b: int)   = (a= 2.0, b= 3);
						val inner_bb: (a: int,   b: float) = (a= 5,   b= 6.0);
						val inner_c:  (b: int,   a: bool)  = (b= 7,   a= true);

						val inner_a: (a: int,   b: (a: float, b: int))   = (a= 1,   b= inner_ab);
						val inner_b: (a: float, b: (a: int,   b: float)) = (a= 4.0, b= inner_bb);

						val record: (
							a: (a: int,   b: (a: float, b: int)),
							b: (a: float, b: (a: int,   b: float)),
							c: (b: int,   a: bool),
						) = (a= inner_a, b= inner_b, c= inner_c);
					`, CONFIG_FOLDING_OFF);
					goal.varCheck();
					goal.typeCheck();
					goal.build();

					const mod: binaryen.Module = goal.builder.module;
					return assertEqualBins(
						(goal.children as AST.ASTNodeDeclarationVariable[]).map((stmt) => stmt.assigned!.build()),
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
});
