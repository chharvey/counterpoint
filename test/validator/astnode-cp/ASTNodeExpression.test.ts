import * as assert from 'assert';
import {
	type CPConfig,
	CONFIG_DEFAULT,
	AST,
	OBJ,
	TYPE,
	INST,
	Builder,
	ReferenceErrorUndeclared,
	ReferenceErrorDeadZone,
	ReferenceErrorKind,
	AssignmentErrorDuplicateKey,
	TypeErrorUnexpectedRef,
} from '../../../src/index.js';
import {assert_instanceof} from '../../../src/lib/index.js';
import {assertAssignable} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	typeUnitInt,
	typeUnitFloat,
	typeUnitStr,
	instructionConstInt,
	instructionConstFloat,
} from '../../helpers.js';



describe('ASTNodeExpression', () => {
	describe('ASTNodeConstant', () => {
		describe('#varCheck', () => {
			it('never throws.', () => {
				AST.ASTNodeConstant.fromSource('42;').varCheck();
			});
		});


		describe('#type', () => {
			it('returns the result of `this#fold`, wrapped in a `new TypeUnit`.', () => {
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
					constants.map((c) => new TYPE.TypeUnit(c.fold())),
				);
			});
		});


		describe('#fold', () => {
			/* eslint-disable array-element-newline */
			it('computes null and boolean values.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
				].map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					OBJ.Null.NULL,
					OBJ.Boolean.FALSE,
					OBJ.Boolean.TRUE,
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
				].map((v) => new OBJ.Integer(BigInt(v))));
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
				].map((v) => new OBJ.Float(v)));
			});
			it('computes string values.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeConstant.fromSource('"42😀\\u{1f600}";').type(),
					typeUnitStr('42😀\u{1f600}'),
				);
			});
			/* eslint-enable array-element-newline */
		});


		describe('#build', () => {
			it('returns InstructionConst.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
					'0;',
					'+0;',
					'-0;',
					'42;',
					'+42;',
					'-42;',
					'0.0;',
					'+0.0;',
					'-0.0;',
					'-4.2e-2;',
				].map((src) => AST.ASTNodeConstant.fromSource(src).build(new Builder(src))), [
					instructionConstInt(0n),
					instructionConstInt(0n),
					instructionConstInt(1n),
					instructionConstInt(0n),
					instructionConstInt(0n),
					instructionConstInt(0n),
					instructionConstInt(42n),
					instructionConstInt(42n),
					instructionConstInt(-42n),
					instructionConstFloat(0),
					instructionConstFloat(0),
					instructionConstFloat(-0),
					instructionConstFloat(-0.042),
				]);
			});
		});
	});



	describe('ASTNodeVariable', () => {
		describe('#varCheck', () => {
			it('throws if the validator does not contain a record for the identifier.', () => {
				AST.ASTNodeGoal.fromSource(`
					let unfixed i: int = 42;
					i;
				`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource('i;').varCheck(), ReferenceErrorUndeclared);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					i;
					let unfixed i: int = 42;
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
			it('returns Never for undeclared variables.', () => {
				assert.ok(AST.ASTNodeVariable.fromSource('x;').type().isBottomType);
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
					new OBJ.Integer(42n),
				);
			});
			it('returns null for an unfixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 21 * 2;
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
			it('returns null for an uncomputable fixed variable.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 21 * 2;
					let y: int = x / 2;
					y;
				`);
				goal.varCheck();
				goal.typeCheck();
				assert.ok(!(goal.children[1] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(goal.children[2] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
		});


		describe('#build', () => {
			it('with constant folding on, returns InstructionConst for fixed & foldable variables.', () => {
				const src: string = `
					let x: int = 42;
					let y: float = 4.2 * 10;
					x;
					y;
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				goal.varCheck();
				goal.typeCheck();
				const builder = new Builder(src);
				assert.deepStrictEqual(
					[
						goal.children[2].build(builder),
						goal.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, instructionConstInt(42n)),
						new INST.InstructionStatement(1n, instructionConstFloat(42.0)),
					],
				);
			});
			it('with constant folding on, returns InstructionGlobalGet for unfixed / non-foldable variables.', () => {
				const src: string = `
					let unfixed x: int = 42;
					let y: int = x + 10;
					x;
					y;
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src);
				goal.varCheck();
				goal.typeCheck();
				const builder = new Builder(src);
				assert.deepStrictEqual(
					[
						goal.children[2].build(builder),
						goal.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, new INST.InstructionGlobalGet(0x100n)),
						new INST.InstructionStatement(1n, new INST.InstructionGlobalGet(0x101n)),
					],
				);
			});
			it('with constant folding off, always returns InstructionGlobalGet.', () => {
				const src: string = `
					let x: int = 42;
					let unfixed y: float = 4.2;
					x;
					y;
				`;
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(src, CONFIG_FOLDING_OFF);
				goal.varCheck();
				goal.typeCheck();
				const builder = new Builder(src, CONFIG_FOLDING_OFF);
				assert.deepStrictEqual(
					[
						goal.children[2].build(builder),
						goal.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, new INST.InstructionGlobalGet(0x100n)),
						new INST.InstructionStatement(1n, new INST.InstructionGlobalGet(0x101n, true)),
					],
				);
			});
		});
	});



	describe('ASTNodeTemplate', () => {
		function initTemplates(config: CPConfig = CONFIG_DEFAULT): AST.ASTNodeTemplate[] {
			return [
				AST.ASTNodeTemplate.fromSource('"""42😀""";', config),
				AST.ASTNodeTemplate.fromSource('"""the answer is {{ 7 * 3 * 2 }} but what is the question?""";', config),
				(AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 21;
					"""the answer is {{ x * 2 }} but what is the question?""";
				`, config)
					.children[1] as AST.ASTNodeStatementExpression)
					.expr as AST.ASTNodeTemplate,
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
				it('for foldable interpolations, returns the result of `this#fold`, wrapped in a `new TypeUnit`.', () => {
					assert.deepStrictEqual(
						types.slice(0, 2),
						templates.slice(0, 2).map((t) => new TYPE.TypeUnit<OBJ.String>(t.fold()!)),
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
					new OBJ.String('42😀'),
				);
			});
			it('returns a constant String for ASTNodeTemplate with foldable interpolations.', () => {
				assert.deepStrictEqual(
					templates[1].fold(),
					new OBJ.String('the answer is 42 but what is the question?'),
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
		describe('.constructor', () => {
			it('sets `.isRef = true` for constant collections.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple  .fromSource('\\[   1,    2.0,    "three"];'),
						AST.ASTNodeTuple  .fromSource('  [   1,    2.0,    "three"];'),
						AST.ASTNodeRecord .fromSource('\\[a= 1, b= 2.0, c= "three"];'),
						AST.ASTNodeRecord .fromSource('  [a= 1, b= 2.0, c= "three"];'),
					].map((c) => c.isRef),
					[false, true, false, true],
				);
			});
		});


		describe('#varCheck', () => {
			describe('ASTNodeRecord', () => {
				it('throws if containing duplicate keys.', () => {
					[
						AST.ASTNodeTypeRecord .fromSource('[a: int, b: float, c: str]'),
						AST.ASTNodeRecord     .fromSource('[a= 1, b= 2.0, c= "three"];'),
					].forEach((node) => node.varCheck()); // assert does not throw

					[
						AST.ASTNodeTypeRecord .fromSource('[a: int, b: float, a: str]'),
						AST.ASTNodeRecord     .fromSource('[a= 1, b= 2.0, a= "three"];'),
					].forEach((node) => assert.throws(() => node.varCheck(), AssignmentErrorDuplicateKey));

					new Map<AST.ASTNodeCP, string[]>([
						[AST.ASTNodeTypeRecord .fromSource('[c: int, d: float, c: str, d: bool]'),   ['c', 'd']],
						[AST.ASTNodeRecord     .fromSource('[c= 1, d= 2.0, c= "three", d= false];'), ['c', 'd']],
						[AST.ASTNodeTypeRecord .fromSource('[e: int, f: float, e: str, e: bool]'),   ['e', 'e']],
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
				['with constant folding on.',  CONFIG_DEFAULT,     TYPE.Type.unionAll([typeUnitStr('a'), typeUnitInt(42n), typeUnitFloat(3.0)])],
				['with constant folding off.', CONFIG_FOLDING_OFF, TYPE.Type.unionAll([typeUnitStr('a'), TYPE.INT,         TYPE.FLOAT])],
			] as const).forEach(([description, config, map_ant_type]) => it(description, () => {
				const expected: readonly TYPE.TypeUnit[] = [typeUnitInt(1n), typeUnitFloat(2.0), typeUnitStr('three')];
				const collections: readonly [
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeSet,
					AST.ASTNodeMap,
				] = [
					AST.ASTNodeTuple  .fromSource('  [   1,    2.0,    "three"];', config),
					AST.ASTNodeRecord .fromSource('  [a= 1, b= 2.0, c= "three"];', config),
					AST.ASTNodeTuple  .fromSource('\\[   1,    2.0,    "three"];', config),
					AST.ASTNodeRecord .fromSource('\\[a= 1, b= 2.0, c= "three"];', config),
					AST.ASTNodeSet    .fromSource('  {   1,    2.0,    "three"};', config),
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
						TYPE.TypeTuple.fromTypes(expected, true),
						TYPE.TypeRecord.fromTypes(new Map(collections[1].children.map((c, i) => [
							c.key.id,
							expected[i],
						])), true),
						TYPE.TypeVect.fromTypes(expected),
						TYPE.TypeStruct.fromTypes(new Map(collections[1].children.map((c, i) => [
							c.key.id,
							expected[i],
						]))),
						new TYPE.TypeSet(TYPE.Type.unionAll(expected), true),
						new TYPE.TypeMap(
							map_ant_type,
							TYPE.Type.unionAll(expected),
							true,
						),
					],
				);
			}));
			it('throws if value type contains reference type.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let val_obj1: \\[1.0] = \\[1.0];
					let ref_obj1:   [1.0] =   [1.0];
					let val_obj2: \\[2.0] = \\[2.0];
					let ref_obj2:   [2.0] =   [2.0];

					\\[1, val_obj1, "three"];
					  [1, ref_obj1, "three"];
					  [1, val_obj2, "three"];
					\\[1, ref_obj2, "three"];

					\\[a= 1, b= \\[3.0],             c= "three"];
					  [a= 1, b= List.<float>([3.0]), c= "three"];
					  [a= 1, b= \\[4.0],             c= "three"];
					\\[a= 1, b= List.<float>([4.0]), c= "three"]; %> TypeErrorUnexpectedRef
				`);
				goal.varCheck();
				return assert.throws(() => goal.typeCheck(), TypeErrorUnexpectedRef);
			});
		});


		describe('#fold', () => {
			it('returns Vect/Struct for constant collections.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple  .fromSource('\\[   1,    2.0,    "three"];'),
						AST.ASTNodeRecord .fromSource('\\[a= 1, b= 2.0, c= "three"];'),
					].map((c) => c.fold()),
					[
						new OBJ.Vect([
							new OBJ.Integer(1n),
							new OBJ.Float(2.0),
							new OBJ.String('three'),
						]),
						new OBJ.Struct(new Map<bigint, OBJ.Object>([
							[0x100n, new OBJ.Integer(1n)],
							[0x101n, new OBJ.Float(2.0)],
							[0x102n, new OBJ.String('three')],
						])),
					],
				);
			});
			it('returns a constant Tuple/Record/Set/Map for foldable entries.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple.fromSource('[1, 2.0, "three"];'),
						AST.ASTNodeRecord.fromSource('[a= 1, b= 2.0, c= "three"];'),
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
						new OBJ.Tuple([
							new OBJ.Integer(1n),
							new OBJ.Float(2.0),
							new OBJ.String('three'),
						]),
						new OBJ.Record(new Map<bigint, OBJ.Object>([
							[0x100n, new OBJ.Integer(1n)],
							[0x101n, new OBJ.Float(2.0)],
							[0x102n, new OBJ.String('three')],
						])),
						new OBJ.Set(new Set([
							new OBJ.Integer(1n),
							new OBJ.Float(2.0),
							new OBJ.String('three'),
						])),
						new OBJ.Map(new Map<OBJ.Object, OBJ.Object>([
							[new OBJ.String('a'),  new OBJ.Integer(1n)],
							[new OBJ.Integer(42n), new OBJ.Float(2.0)],
							[new OBJ.Float(3.0),   new OBJ.String('three')],
						])),
					],
				);
			});
			it('returns null for non-foldable entries.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 1;
					let unfixed y: float = 2.0;
					let unfixed z: str = "three";
					[x, 2.0, "three"];
					[a= 1, b= y, c= "three"];
					% TODO: a non-foldable set object should be null
					{
						"a" || "" -> 1,
						21 + 21   -> y,
						3 * 1.0   -> "three",
					};
				`);
				const tuple:   AST.ASTNodeTuple   = (goal.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTuple;
				const record:  AST.ASTNodeRecord  = (goal.children[4] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeRecord;
				const map:     AST.ASTNodeMap     = (goal.children[5] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeMap;
				assert.deepStrictEqual(
					[
						tuple,
						record,
						map,
					].map((c) => c.fold()),
					[null, null, null],
				);
			});
		});
	});
});
