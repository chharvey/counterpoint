import * as assert from 'assert';
import binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	VALUE,
	TYPE,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateKey,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {
	assertEqualBins,
	assertAssignable,
} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	typeUnit,
	buildConst,
} from '../../helpers.js';



describe('ASTNodeExpression', () => {
	describe('ASTNodeConstant', () => {
		describe('#varCheck', () => {
			it('never throws.', () => {
				AST.ASTNodeConstant.fromSource('42;').varCheck();
			});
		});


		describe('#type', () => {
			it('returns the result of `this#fold`, wrapped in a `new Unit`.', () => {
				const constants: AST.ASTNodeConstant[] = `
					null  false  true
					55  -55  033  -033  0  -0
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					"42😀"  "42\\u{1f600}"
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`));
				assert.deepStrictEqual(
					constants.map((c) => c.type()),
					constants.map((c) => new TYPE.Unit(c.fold())),
				);
			});
		});


		/* eslint-disable @stylistic/array-element-newline */
		describe('#fold', () => {
			it('computes null and boolean values.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
				].map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					VALUE.NULL,
					VALUE.FALSE,
					VALUE.TRUE,
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
				assert.deepStrictEqual(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`, integer_radices_on).fold()), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new VALUE.Integer(BigInt(v))));
			});
			it('computes float values.', () => {
				assert.deepStrictEqual(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`).fold()), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new VALUE.Float(v)));
			});
			it('computes string values.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeConstant.fromSource('"42😀\\u{1f600}";').type(),
					typeUnit('42😀\u{1f600}'),
				);
			});
		});
		/* eslint-enable @stylistic/array-element-newline */


		specify('#build', () => {
			const mod = new binaryen.Module();
			const tests = new Map<string, binaryen.ExpressionRef>([
				['null;',    buildConst(mod)],
				['false;',   buildConst(mod, false)],
				['true;',    buildConst(mod, true)],
				['0;',       buildConst(mod, 0n)],
				['+0;',      buildConst(mod, 0n)],
				['-0;',      buildConst(mod, 0n)],
				['42;',      buildConst(mod, 42n)],
				['+42;',     buildConst(mod, 42n)],
				['-42;',     buildConst(mod, -42n)],
				['0.0;',     buildConst(mod, 0)],
				['+0.0;',    buildConst(mod, 0)],
				['-0.0;',    buildConst(mod, -0)],
				['-4.2e-2;', buildConst(mod, -0.042)],
			]);
			return assertEqualBins(
				[...tests.keys()].map((src) => AST.ASTNodeConstant.fromSource(src, CONFIG_FOLDING_OFF).build()),
				[...tests.values()],
			);
		});
	});



	describe('ASTNodeVariable', () => {
		describe('#varCheck', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`
					let var i: int = 42;
					i;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource('i;').varCheck(), ReferenceErrorUndeclared);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					i;
					let var i: int = 42;
				`).varCheck(), ReferenceErrorDeadZone);
			});
			it('throws if it was declared as a type alias.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type FOO = int;
					42 || FOO;
				`).varCheck(), ReferenceErrorKind);
			});
		});


		describe('#fold', () => {
			it('assesses the value of a fixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let x: int = 21 * 2;
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
					let var x: int = 21 * 2;
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
					let fixed_mutable: mut int{} = {1, 2, 3};
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
					let var x: int = 21 * 2;
					let y: int = x / 2;
					y;
					let z: mut int{} = {11, 22, 33};
					let w: bool = z.[22];
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
					let x: int = 42;
					let y: float = 4.2 * 10;
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
						buildConst(goal.builder.module, 42n),
						buildConst(goal.builder.module, 42.0),
					],
				);
			});
			it('with constant folding on, returns `(local.get)` for unfixed / non-foldable variables.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let var x: int = 42;
					let y: int = x + 10;
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
					let x: int = 42;
					let var y: float = 4.2;
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
				let var x: int = 21;
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
					assert.deepStrictEqual(
						types.slice(0, 2),
						templates.slice(0, 2).map((t) => new TYPE.Unit<VALUE.String>(t.fold()!)),
					);
				});
				it('for non-foldable interpolations, returns `String`.', () => {
					assert.deepStrictEqual(types[2], TYPE.STR);
				});
			});
			context('with constant folding off.', () => {
				it('always returns `String`.', () => {
					templates = initTemplates(CONFIG_FOLDING_OFF);
					templates.forEach((t) => {
						assert.deepStrictEqual(t.type(), TYPE.STR);
					});
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
			describe('ASTNodeRecord', () => {
				it('throws if containing duplicate keys.', () => {
					[
						AST.ASTNodeTypeRecord .fromSource('[a: int, b: float, c: str]'),
						AST.ASTNodeRecord     .fromSource('[a= 1, b= 2.0, c= "three"];'),
					].forEach((node) => node.varCheck()); // assert does not throw

					[
						AST.ASTNodeTypeRecord .fromSource('[a: int, b: float, a: str]'),
						AST.ASTNodeTypeRecord .fromSource('[_: int, b: float, _: str]'),
						AST.ASTNodeRecord     .fromSource('[a= 1, b= 2.0, a= "three"];'),
						AST.ASTNodeRecord     .fromSource('[_= 1, b= 2.0, _= "three"];'),
					].forEach((node) => assert.throws(() => node.varCheck(), AssignmentErrorDuplicateKey));

					new Map<AST.ASTNodeCP, string[]>([
						[AST.ASTNodeTypeRecord .fromSource('[c: int, d: float, c: str, d: bool]'),   ['c', 'd']],
						[AST.ASTNodeTypeRecord .fromSource('[e: int, f: float, e: str, e: bool]'),   ['e', 'e']],
						[AST.ASTNodeRecord     .fromSource('[c= 1, d= 2.0, c= "three", d= false];'), ['c', 'd']],
						[AST.ASTNodeRecord     .fromSource('[e= 1, f= 2.0, e= "three", e= false];'), ['e', 'e']],
					]).forEach((dupes, node) => assert.throws(() => node.varCheck(), (err) => {
						assert_instanceof(err, AggregateError);
						assertAssignable(err, {
							cons:   AggregateError,
							errors: dupes.map((k) => ({
								cons:    AssignmentErrorDuplicateKey,
								message: `Duplicate record key \`${ k }\`.`,
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
					AST.ASTNodeTuple  .fromSource('[   1,    2.0,    "three"];', config),
					AST.ASTNodeRecord .fromSource('[a= 1, b= 2.0, _= "three"];', config),
					AST.ASTNodeSet    .fromSource('{   1,    2.0,    "three"};', config),
					AST.ASTNodeMap.fromSource(`
						{
							"a" || "" -> 1,
							21 + 21   -> 2.0,
							3 * 1.0   -> "three",
						};
					`, config),
				];
				assert.deepStrictEqual(
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
					  [   1,    List.<float>([2.2]),    "three"];
					  [a= 1, b= List.<float>([2.2]), c= "three"];
				`);
				goal.varCheck();
				goal.typeCheck(); // assert does not throw
			});
		});


		describe('#fold', () => {
			it('returns Tuple/Record for constant collections.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple  .fromSource('  [   1,    2.0,    "three"];'),
						AST.ASTNodeRecord .fromSource('  [a= 1, b= 2.0, c= "three"];'),
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
			it('returns a constant Set/Map for foldable entries.', () => {
				assert.deepStrictEqual(
					[
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
					let var x: int   = 1;
					let var y: float = 2.0;
					let var z: str   = "three";
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
				assert.deepStrictEqual(
					[
						(goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTuple,
						(goal.children[4] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeRecord,
						(goal.children[5] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeSet,
						(goal.children[6] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeMap,
					].map((c) => c.fold()),
					[null, null, null, null],
				);
			});
		});


		describe('#build', () => {
			specify.skip('ASTNodeTuple', () => {
				const tuple: AST.ASTNodeTuple = AST.ASTNodeTuple.fromSource('[1, 2.0];', CONFIG_FOLDING_OFF);
				assertEqualBins(
					tuple.build(),
					tuple.builder.module.tuple.make([buildConst(tuple.builder.module, 1n), buildConst(tuple.builder.module, 2.0)]),
				);
			});
			it.skip('foldable.', () => {
				AST.ASTNodeTuple.fromSource('[1, 2.0, null];').build();
			});
			it.skip('non-foldable.', () => {
				AST.ASTNodeGoal.fromSource(`
					let var x: null = null;
					[1, 2.0, x];
				`).build();
			});
		});
	});
});
