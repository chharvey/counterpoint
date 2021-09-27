import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	// {ASTNodeKey, ...} as AST,
	Validator,
	SolidType,
	SolidTypeConstant,
	SolidTypeTuple,
	SolidTypeRecord,
	SolidTypeSet,
	SolidTypeMap,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
	SolidTuple,
	SolidRecord,
	SolidSet,
	SolidMap,
	INST,
	Builder,
	ReferenceError01,
	ReferenceError02,
	ReferenceError03,
} from '../../src/index.js';
import * as AST from '../../src/validator/astnode/index.js'; // HACK
import {assert_wasCalled} from '../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	typeConstInt,
	typeConstFloat,
	typeConstStr,
	instructionConstInt,
	instructionConstFloat,
} from '../helpers.js';



describe('ASTNodeExpression', () => {
	describe('ASTNodeConstant', () => {
		describe('#varCheck', () => {
			it('never throws.', () => {
				AST.ASTNodeConstant.fromSource(`42;`).varCheck(new Validator());
			});
		});


		describe('#type', () => {
			it('returns the result of `this#fold`, wrapped in a `new SolidTypeConstant`.', () => {
				const constants: AST.ASTNodeConstant[] = `
					null  false  true
					55  -55  033  -033  0  -0
					55.  -55.  033.  -033.  2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					0.  -0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
					${ (Dev.supports('stringConstant-assess')) ? `'42😀'  '42\\u{1f600}'` : `` }
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`));
				const validator: Validator = new Validator();
				assert.deepStrictEqual(constants.map((c) => assert_wasCalled(c.fold, 1, (orig, spy) => {
					c.fold = spy;
					try {
						return c.type(validator);
					} finally {
						c.fold = orig;
					};
				})), constants.map((c) => new SolidTypeConstant(c.fold(validator)!)));
			});
		});


		describe('#fold', () => {
			it('computes null and boolean values.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
				].map((src) => AST.ASTNodeConstant.fromSource(src).fold(new Validator())), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
				]);
			})
			it('computes int values.', () => {
				const integer_radices_on: SolidConfig = {
					...CONFIG_DEFAULT,
					languageFeatures: {
						...CONFIG_DEFAULT.languageFeatures,
						integerRadices: true,
					},
				};
				assert.deepStrictEqual(`
					55  -55  033  -033  0  -0
					\\o55  -\\o55  \\q033  -\\q033
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`, integer_radices_on).fold(new Validator())), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new Int16(BigInt(v))));
			});
			it('computes float values.', () => {
				assert.deepStrictEqual(`
					55.  -55.  033.  -033.  2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					0.  -0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(`${ src };`).fold(new Validator())), [
					55, -55, 33, -33, 2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					0, -0, -0, 6.8, 6.8, 0, -0,
				].map((v) => new Float64(v)));
			})
			Dev.supports('stringConstant-assess') && it('computes string values.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeConstant.fromSource(`'42😀\\u{1f600}';`).type(new Validator()),
					typeConstStr('42😀\u{1f600}'),
				);
			});
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
				`).varCheck(new Validator()); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource(`i;`).varCheck(new Validator()), ReferenceError01);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					i;
					let unfixed i: int = 42;
				`).varCheck(new Validator()), ReferenceError02);
			});
			it('throws if it was declared as a type alias.', () => {
				assert.throws(() => AST.ASTNodeGoal.fromSource(`
					type FOO = int;
					42 || FOO;
				`).varCheck(new Validator()), ReferenceError03);
			});
		});


		describe('#type', () => {
			it('returns Never for undeclared variables.', () => {
				assert.strictEqual(AST.ASTNodeVariable.fromSource(`x;`).type(new Validator()), SolidType.NEVER);
			});
		});


		describe('#fold', () => {
			it('assesses the value of a fixed variable.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let x: int = 21 * 2;
					x;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.ok(!(goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(validator),
					new Int16(42n),
				);
			});
			it('returns null for an unfixed variable.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 21 * 2;
					x;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.ok((goal.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(goal.children[1] as AST.ASTNodeStatementExpression).expr!.fold(validator),
					null,
				);
			});
			it('returns null for an uncomputable fixed variable.', () => {
				const validator: Validator = new Validator();
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 21 * 2;
					let y: int = x / 2;
					y;
				`);
				goal.varCheck(validator);
				goal.typeCheck(validator);
				assert.ok(!(goal.children[1] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(goal.children[2] as AST.ASTNodeStatementExpression).expr!.fold(validator),
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
				const builder: Builder = new Builder(src);
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
				const builder: Builder = new Builder(src);
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
				const builder: Builder = new Builder(src, CONFIG_FOLDING_OFF);
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



	Dev.supports('stringTemplate-assess') && describe('ASTNodeTemplate', () => {
		describe('#type', () => {
			let templates: readonly AST.ASTNodeTemplate[];
			function initTemplates() {
				return [
					AST.ASTNodeTemplate.fromSource(`'''42😀''';`),
					AST.ASTNodeTemplate.fromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`),
					(AST.ASTNodeGoal.fromSource(`
						let unfixed x: int = 21;
						'''the answer is {{ x * 2 }} but what is the question?''';
					`)
						.children[1] as AST.ASTNodeStatementExpression)
						.expr as AST.ASTNodeTemplate,
				] as const;
			}
			context('with constant folding on.', () => {
				const validator: Validator = new Validator();
				let types: SolidType[];
				before(() => {
					templates = initTemplates();
					types = templates.map((t) => assert_wasCalled(t.fold, 1, (orig, spy) => {
						t.fold = spy;
						try {
							return t.type(validator);
						} finally {
							t.fold = orig;
						};
					}));
				});
				it('for foldable interpolations, returns the result of `this#fold`, wrapped in a `new SolidTypeConstant`.', () => {
					assert.deepStrictEqual(
						types.slice(0, 2),
						templates.slice(0, 2).map((t) => new SolidTypeConstant(t.fold(validator)!)),
					);
				});
				it('for non-foldable interpolations, returns `String`.', () => {
					assert.deepStrictEqual(types[2], SolidString);
				});
			});
			context('with constant folding off.', () => {
				it('always returns `String`.', () => {
					templates = initTemplates();
					templates.forEach((t) => {
						assert.deepStrictEqual(t.type(new Validator(CONFIG_FOLDING_OFF)), SolidString);
					});
				});
			});
		});


		describe('#fold', () => {
			let templates: AST.ASTNodeTemplate[];
			before(() => {
				templates = [
					AST.ASTNodeTemplate.fromSource(`'''42😀''';`),
					AST.ASTNodeTemplate.fromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`),
					(AST.ASTNodeGoal.fromSource(`
						let unfixed x: int = 21;
						'''the answer is {{ x * 2 }} but what is the question?''';
					`)
						.children[1] as AST.ASTNodeStatementExpression)
						.expr as AST.ASTNodeTemplate,
				];
			});
			it('returns a constant String for ASTNodeTemplate with no interpolations.', () => {
				assert.deepStrictEqual(
					templates[0].fold(new Validator()),
					new SolidString('42😀'),
				);
			});
			it('returns a constant String for ASTNodeTemplate with foldable interpolations.', () => {
				assert.deepStrictEqual(
					templates[1].fold(new Validator()),
					new SolidString('the answer is 42 but what is the question?'),
				);
			});
			it('returns null for ASTNodeTemplate with dynamic interpolations.', () => {
				assert.deepStrictEqual(
					templates[2].fold(new Validator()),
					null,
				);
			});
		});
	});



	describe('ASTNode{Tuple,Record,Set,Map}', () => {
		describe('#type', () => {
			let collections: readonly [
				AST.ASTNodeTuple,
				AST.ASTNodeRecord,
				AST.ASTNodeSet,
				AST.ASTNodeMap,
			];
			function initCollections() {
				return [
					AST.ASTNodeTuple.fromSource(`[1, 2.0, 'three'];`),
					AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, c= 'three'];`),
					AST.ASTNodeSet.fromSource(`{1, 2.0, 'three'};`),
					AST.ASTNodeMap.fromSource(`
						{
							'a' || '' -> 1,
							21 + 21   -> 2.0,
							3 * 1.0   -> 'three',
						};
					`),
				] as const;
			}
			context('with constant folding on.', () => {
				const validator: Validator = new Validator();
				let types: SolidType[];
				before(() => {
					collections = initCollections();
					types = collections.map((c) => assert_wasCalled(c.fold, 1, (orig, spy) => {
						c.fold = spy;
						try {
							return c.type(validator);
						} finally {
							c.fold = orig;
						};
					}));
				});
				it('returns the result of `this#fold`, wrapped in a `new SolidTypeConstant`.', () => {
					assert.deepStrictEqual(
						types,
						collections.map((c) => new SolidTypeConstant(c.fold(validator)!)),
					);
				});
			});
			it('with constant folding off.', () => {
				const expected: SolidTypeConstant[] = [typeConstInt(1n), typeConstFloat(2.0), typeConstStr('three')];
				collections = initCollections();
				const validator: Validator = new Validator(CONFIG_FOLDING_OFF);
				assert.deepStrictEqual(
					collections.map((node) => node.type(validator)),
					[
						SolidTypeTuple.fromTypes(expected).mutableOf(),
						SolidTypeRecord.fromTypes(new Map(collections[1].children.map((c, i) => [
							c.key.id,
							expected[i],
						]))).mutableOf(),
						new SolidTypeSet(SolidType.unionAll(expected)).mutableOf(),
						new SolidTypeMap(
							SolidType.unionAll([typeConstStr('a'), Int16, Float64]),
							SolidType.unionAll(expected),
						).mutableOf(),
					],
				);
			});
		});


		describe('#fold', () => {
			it('returns a constant Tuple/Record/Set/Map for foldable entries.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple.fromSource(`[1, 2.0, 'three'];`),
						AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, c= 'three'];`),
						AST.ASTNodeSet.fromSource(`{1, 2.0, 'three'};`),
						AST.ASTNodeMap.fromSource(`
							{
								'a' || '' -> 1,
								21 + 21   -> 2.0,
								3 * 1.0   -> 'three',
							};
						`),
					].map((c) => c.fold(new Validator())),
					[
						new SolidTuple([
							new Int16(1n),
							new Float64(2.0),
							new SolidString('three'),
						]),
						new SolidRecord(new Map<bigint, SolidObject>([
							[0x100n, new Int16(1n)],
							[0x101n, new Float64(2.0)],
							[0x102n, new SolidString('three')],
						])),
						new SolidSet(new Set([
							new Int16(1n),
							new Float64(2.0),
							new SolidString('three'),
						])),
						new SolidMap(new Map<SolidObject, SolidObject>([
							[new SolidString('a'), new Int16(1n)],
							[new Int16(42n),       new Float64(2.0)],
							[new Float64(3.0),     new SolidString('three')],
						])),
					],
				);
			});
			it('returns null for non-foldable entries.', () => {
				const goal: AST.ASTNodeGoal = AST.ASTNodeGoal.fromSource(`
					let unfixed x: int = 1;
					let unfixed y: float = 2.0;
					let unfixed z: str = 'three';
					[x, 2.0, 'three'];
					[a= 1, b= y, c= 'three'];
					% TODO: a non-foldable set object should be null
					{
						'a' || '' -> 1,
						21 + 21   -> y,
						3 * 1.0   -> 'three',
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
					].map((c) => c.fold(new Validator())),
					[null, null, null],
				);
			});
			it('ASTNodeRecord overwrites duplicate keys.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, a= 'three'];`).fold(new Validator()),
					new SolidRecord(new Map<bigint, SolidObject>([
						[0x101n, new Float64(2.0)],
						[0x100n, new SolidString('three')],
					])),
				);
			});
			// TODO: SolidSet overwrites duplicate elements. // move this to SolidType.test.ts
		});
	});
});
