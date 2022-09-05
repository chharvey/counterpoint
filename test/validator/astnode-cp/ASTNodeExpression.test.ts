import * as assert from 'assert';
import {
	CPConfig,
	CONFIG_DEFAULT,
	AST,
	TYPE,
	OBJ,
	INST,
	Builder,
	ReferenceError01,
	ReferenceError02,
	ReferenceError03,
	TypeError03,
} from '../../../src/index.js';
import {assert_wasCalled} from '../../assert-helpers.js';
import {
	CONFIG_FOLDING_OFF,
	CONFIG_COERCION_OFF,
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
				AST.ASTNodeConstant.fromSource(`42`).varCheck();
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
					'42😀'  '42\\u{1f600}'
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(src));
				assert.deepStrictEqual(constants.map((c) => assert_wasCalled(c.fold, 1, (orig, spy) => {
					c.fold = spy;
					try {
						return c.type();
					} finally {
						c.fold = orig;
					};
				})), constants.map((c) => new TYPE.TypeUnit(c.fold()!)));
			});
		});


		describe('#fold', () => {
			it('computes null and boolean values.', () => {
				assert.deepStrictEqual([
					'null',
					'false',
					'true',
				].map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					OBJ.Null.NULL,
					OBJ.Boolean.FALSE,
					OBJ.Boolean.TRUE,
				]);
			})
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
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(src, integer_radices_on).fold()), [
					55, -55, 33, -33, 0, 0,
					parseInt('55', 8), parseInt('-55', 8), parseInt('33', 4), parseInt('-33', 4),
				].map((v) => new OBJ.Integer(BigInt(v))));
			});
			it('computes float values.', () => {
				assert.deepStrictEqual(`
					2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => AST.ASTNodeConstant.fromSource(src).fold()), [
					2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, 6.8, 6.8, 0, -0,
				].map((v) => new OBJ.Float(v)));
			})
			it('computes string values.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeConstant.fromSource(`'42😀\\u{1f600}'`).type(),
					typeUnitStr('42😀\u{1f600}'),
				);
			});
		});


		describe('#build', () => {
			it('returns InstructionConst.', () => {
				assert.deepStrictEqual([
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
				].map((src) => AST.ASTNodeConstant.fromSource(src).build(new Builder(`{ ${ src }; }`))), [
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
				AST.ASTNodeBlock.fromSource(`{
					let unfixed i: int = 42;
					i;
				}`).varCheck(); // assert does not throw
				assert.throws(() => AST.ASTNodeVariable.fromSource(`i`).varCheck(), ReferenceError01);
			});
			it.skip('throws when there is a temporal dead zone.', () => {
				assert.throws(() => AST.ASTNodeBlock.fromSource(`{
					i;
					let unfixed i: int = 42;
				}`).varCheck(), ReferenceError02);
			});
			it('throws if it was declared as a type alias.', () => {
				assert.throws(() => AST.ASTNodeBlock.fromSource(`{
					type FOO = int;
					42 || FOO;
				}`).varCheck(), ReferenceError03);
			});
		});


		describe('#type', () => {
			it('returns Never for undeclared variables.', () => {
				assert.strictEqual(AST.ASTNodeVariable.fromSource(`x`).type(), TYPE.Type.NEVER);
			});
		});


		describe('#fold', () => {
			it('assesses the value of a fixed variable.', () => {
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(`{
					let x: int = 21 * 2;
					x;
				}`);
				block.varCheck();
				block.typeCheck();
				assert.ok(!(block.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(block.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					new OBJ.Integer(42n),
				);
			});
			it('returns null for an unfixed variable.', () => {
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(`{
					let unfixed x: int = 21 * 2;
					x;
				}`);
				block.varCheck();
				block.typeCheck();
				assert.ok((block.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(block.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			it('returns null for a fixed variable of mutable type.', () => {
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(`{
					let tup_fixed_mutable: mutable [int, float, str] = [1, 2.0, 'three'];
					tup_fixed_mutable;
				}`);
				block.varCheck();
				block.typeCheck();
				assert.ok((block.children[0] as AST.ASTNodeDeclarationVariable).typenode.eval().hasMutable);
				assert.deepStrictEqual(
					(block.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
			it('returns null for an uncomputable fixed variable.', () => {
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(`{
					let unfixed x: int = 21 * 2;
					let y: int = x / 2;
					y;
					let z: mutable [int, float, str] = [1, 2.0, 'three'];
					let w: int = z.0;
					w;
				}`);
				block.varCheck();
				block.typeCheck();
				assert.ok(!(block.children[1] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.ok(!(block.children[4] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					[
						(block.children[2] as AST.ASTNodeStatementExpression).expr!.fold(),
						(block.children[5] as AST.ASTNodeStatementExpression).expr!.fold(),
					],
					[null, null],
				);
			});
			it('with constant folding off, returns null even for a fixed variable.', () => {
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(`{
					let x: int = 21 * 2;
					x;
				}`, CONFIG_FOLDING_OFF);
				block.varCheck();
				block.typeCheck();
				assert.ok(!(block.children[0] as AST.ASTNodeDeclarationVariable).unfixed);
				assert.deepStrictEqual(
					(block.children[1] as AST.ASTNodeStatementExpression).expr!.fold(),
					null,
				);
			});
		});


		describe('#build', () => {
			it('with constant folding on, returns InstructionConst for fixed & foldable variables.', () => {
				const src: string = `{
					let x: int = 42;
					let y: float = 4.2 * 10;
					x;
					y;
				}`;
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
				block.varCheck();
				block.typeCheck();
				const builder: Builder = new Builder(src);
				assert.deepStrictEqual(
					[
						block.children[2].build(builder),
						block.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, instructionConstInt(42n)),
						new INST.InstructionStatement(1n, instructionConstFloat(42.0)),
					],
				);
			});
			it('with constant folding on, returns InstructionGlobalGet for unfixed / non-foldable variables.', () => {
				const src: string = `{
					let unfixed x: int = 42;
					let y: int = x + 10;
					x;
					y;
				}`;
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src);
				block.varCheck();
				block.typeCheck();
				const builder: Builder = new Builder(src);
				assert.deepStrictEqual(
					[
						block.children[2].build(builder),
						block.children[3].build(builder),
					],
					[
						new INST.InstructionStatement(0n, new INST.InstructionGlobalGet(0x100n)),
						new INST.InstructionStatement(1n, new INST.InstructionGlobalGet(0x101n)),
					],
				);
			});
			it('with constant folding off, always returns InstructionGlobalGet.', () => {
				const src: string = `{
					let x: int = 42;
					let unfixed y: float = 4.2;
					x;
					y;
				}`;
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(src, CONFIG_FOLDING_OFF);
				block.varCheck();
				block.typeCheck();
				const builder: Builder = new Builder(src, CONFIG_FOLDING_OFF);
				assert.deepStrictEqual(
					[
						block.children[2].build(builder),
						block.children[3].build(builder),
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
		describe('#type', () => {
			let templates: readonly AST.ASTNodeTemplate[];
			function initTemplates(config: CPConfig = CONFIG_DEFAULT) {
				return [
					AST.ASTNodeTemplate.fromSource(`'''42😀'''`, config),
					AST.ASTNodeTemplate.fromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?'''`, config),
					(AST.ASTNodeBlock.fromSource(`{
						let unfixed x: int = 21;
						'''the answer is {{ x * 2 }} but what is the question?''';
					}`, config)
						.children[1] as AST.ASTNodeStatementExpression)
						.expr as AST.ASTNodeTemplate,
				] as const;
			}
			context('with constant folding on.', () => {
				let types: TYPE.Type[];
				before(() => {
					templates = initTemplates();
					types = templates.map((t) => assert_wasCalled(t.fold, 1, (orig, spy) => {
						t.fold = spy;
						try {
							return t.type();
						} finally {
							t.fold = orig;
						};
					}));
				});
				it('for foldable interpolations, returns the result of `this#fold`, wrapped in a `new TypeUnit`.', () => {
					assert.deepStrictEqual(
						types.slice(0, 2),
						templates.slice(0, 2).map((t) => new TYPE.TypeUnit(t.fold()!)),
					);
				});
				it('for non-foldable interpolations, returns `String`.', () => {
					assert.deepStrictEqual(types[2], TYPE.Type.STR);
				});
			});
			context('with constant folding off.', () => {
				it('always returns `String`.', () => {
					templates = initTemplates(CONFIG_FOLDING_OFF);
					templates.forEach((t) => {
						assert.deepStrictEqual(t.type(), TYPE.Type.STR);
					});
				});
			});
		});


		describe('#fold', () => {
			let templates: AST.ASTNodeTemplate[];
			before(() => {
				templates = [
					AST.ASTNodeTemplate.fromSource(`'''42😀'''`),
					AST.ASTNodeTemplate.fromSource(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?'''`),
					(AST.ASTNodeBlock.fromSource(`{
						let unfixed x: int = 21;
						'''the answer is {{ x * 2 }} but what is the question?''';
					}`)
						.children[1] as AST.ASTNodeStatementExpression)
						.expr as AST.ASTNodeTemplate,
				];
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



	describe('ASTNode{Tuple,Record,Set,Map}', () => {
		describe('#type', () => {
			([
				['with constant folding on.',  CONFIG_DEFAULT,     TYPE.Type.unionAll([typeUnitStr('a'), typeUnitInt(42n), typeUnitFloat(3.0)])],
				['with constant folding off.', CONFIG_FOLDING_OFF, TYPE.Type.unionAll([typeUnitStr('a'), TYPE.Type.INT,    TYPE.Type.FLOAT])],
			] as const).forEach(([description, config, map_ant_type]) => it(description, () => {
				const expected: TYPE.TypeUnit[] = [typeUnitInt(1n), typeUnitFloat(2.0), typeUnitStr('three')];
				const collections: readonly [
					AST.ASTNodeTuple,
					AST.ASTNodeRecord,
					AST.ASTNodeSet,
					AST.ASTNodeMap,
				] = [
					AST.ASTNodeTuple.fromSource(`[1, 2.0, 'three']`, config),
					AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, c= 'three']`, config),
					AST.ASTNodeSet.fromSource(`{1, 2.0, 'three'}`, config),
					AST.ASTNodeMap.fromSource(`
						{
							'a' || '' -> 1,
							21 + 21   -> 2.0,
							3 * 1.0   -> 'three',
						}
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
						new TYPE.TypeSet(TYPE.Type.unionAll(expected), true),
						new TYPE.TypeMap(
							map_ant_type,
							TYPE.Type.unionAll(expected),
							true,
						),
					],
				);
			}));
		});


		describe('#fold', () => {
			it('returns a constant Tuple/Record/Set/Map for foldable entries.', () => {
				assert.deepStrictEqual(
					[
						AST.ASTNodeTuple.fromSource(`[1, 2.0, 'three']`),
						AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, c= 'three']`),
						AST.ASTNodeSet.fromSource(`{1, 2.0, 'three'}`),
						AST.ASTNodeMap.fromSource(`
							{
								'a' || '' -> 1,
								21 + 21   -> 2.0,
								3 * 1.0   -> 'three',
							}
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
				const block: AST.ASTNodeBlock = AST.ASTNodeBlock.fromSource(`{
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
				}`);
				const tuple:   AST.ASTNodeTuple   = (block.children[3] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeTuple;
				const record:  AST.ASTNodeRecord  = (block.children[4] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeRecord;
				const map:     AST.ASTNodeMap     = (block.children[5] as AST.ASTNodeStatementExpression).expr as AST.ASTNodeMap;
				assert.deepStrictEqual(
					[
						tuple,
						record,
						map,
					].map((c) => c.fold()),
					[null, null, null],
				);
			});
			it('ASTNodeRecord overwrites duplicate keys.', () => {
				assert.deepStrictEqual(
					AST.ASTNodeRecord.fromSource(`[a= 1, b= 2.0, a= 'three']`).fold(),
					new OBJ.Record(new Map<bigint, OBJ.Object>([
						[0x101n, new OBJ.Float(2.0)],
						[0x100n, new OBJ.String('three')],
					])),
				);
			});
			// TODO: Set overwrites duplicate elements. // move this to Type.test.ts
		});
	});



	describe('ASTNodeClaim', () => {
		const samples: string[] = [
			`null`,
			`false`,
			`true`,
			`0`,
			`+0`,
			`-0`,
			`42`,
			`+42`,
			`-42`,
			`0.0`,
			`+0.0`,
			`-0.0`,
			`-4.2e-2`,
		];


		describe('#type', () => {
			it('returns the type value of the claimed type.', () => {
				assert.ok(AST.ASTNodeClaim.fromSource(`<int?>3`).type().equals(TYPE.Type.INT.union(TYPE.Type.NULL)));
			});
			it('throws when the operand type and claimed type do not overlap.', () => {
				assert.throws(() => AST.ASTNodeClaim.fromSource(`<str>3`)       .type(), TypeError03);
				assert.throws(() => AST.ASTNodeClaim.fromSource(`<int>'three'`) .type(), TypeError03);
			});
			it('with int coersion off, does not allow converting between int and float.', () => {
				AST.ASTNodeClaim.fromSource(`<float>3`).type(); // assert does not throw
				AST.ASTNodeClaim.fromSource(`<int>3.0`).type(); // assert does not throw
				assert.throws(() => AST.ASTNodeClaim.fromSource(`<float>3`, CONFIG_COERCION_OFF).type(), TypeError03);
				assert.throws(() => AST.ASTNodeClaim.fromSource(`<int>3.0`, CONFIG_COERCION_OFF).type(), TypeError03);
			});
		});


		describe('#fold', () => {
			it('returns the fold of the operand.', () => {
				samples.forEach((expr) => {
					const src: string = `<obj>${ expr }`;
					assert.deepStrictEqual(
						AST.ASTNodeClaim     .fromSource(src) .fold(),
						AST.ASTNodeExpression.fromSource(expr).fold(),
						expr,
					);
				});
			});
		});


		describe('#build', () => {
			it('returns the build of the operand.', () => {
				samples.forEach((expr) => {
					const src: string = `<obj>${ expr }`;
					assert.deepStrictEqual(
						AST.ASTNodeClaim     .fromSource(src) .build(new Builder(`{ ${ src }; }`)),
						AST.ASTNodeExpression.fromSource(expr).build(new Builder(`{ ${ expr }; }`)),
						expr,
					);
				});
			});
		});
	});
});
