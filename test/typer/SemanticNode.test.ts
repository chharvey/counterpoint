import * as assert from 'assert'
import * as xjs from 'extrajs'

import SolidConfig, {CONFIG_DEFAULT} from '../../src/SolidConfig'
import Dev from '../../src/class/Dev.class'
import Operator from '../../src/enum/Operator.enum'
import {
	Screener,
} from '../../src/lexer/'
import {
	Parser,
	ParseNodeGoal,
} from '../../src/parser/'
import {
	SemanticNodeConstant,
	SemanticNodeIdentifier,
	SemanticNodeTemplate,
	SemanticNodeOperation,
	SemanticNodeStatementExpression,
	CompletionStructureAssessment,
	SolidTypeConstant,
	SolidObject,
	SolidNull,
	SolidBoolean,
	Int16,
	Float64,
	SolidString,
} from '../../src/validator/'
import {NanError01} from '../../src/error/NanError.class'
import {
	Builder,
	InstructionNone,
	InstructionExpression,
	InstructionConst,
	InstructionUnop,
	InstructionBinop,
	InstructionCond,
	InstructionStatement,
	InstructionModule,
} from '../../src/builder/'
import {
	instructionConstInt,
	instructionConstFloat,
} from '../helpers'
import {
	operationFromStatementExpression,
	statementExpressionFromSource,
	constantFromStatementExpression,
} from '../helpers-semantic'



describe('SemanticNode', () => {
	describe('#build', () => {
		context('SemanticNodeGoal ::= SOT EOT', () => {
			it('returns InstructionNone.', () => {
				const src: [string, SolidConfig] = [``, CONFIG_DEFAULT]
				const instr: InstructionNone | InstructionModule = new Parser(new Screener(...src).generate(), src[1]).parse().decorate()
					.build(new Parser(new Screener(...src).generate(), src[1]).validator.builder)
				assert.ok(instr instanceof InstructionNone)
			})
		})

		context('SemanticNodeStatement ::= ";"', () => {
			it('returns InstructionNone.', () => {
				const src: [string, SolidConfig] = [`;`, CONFIG_DEFAULT]
				const instr: InstructionNone | InstructionStatement = (new Parser(new Screener(...src).generate(), src[1]).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.build(new Parser(new Screener(...src).generate(), src[1]).validator.builder)
				assert.ok(instr instanceof InstructionNone)
			})
		})

		context('SemanticNodeConstant', () => {
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
				].map((src) =>
					constantFromStatementExpression(
						statementExpressionFromSource(src)
					).build(new Parser(new Screener(src, CONFIG_DEFAULT).generate(), CONFIG_DEFAULT).validator.builder)
				), [
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
				])
			})
		})

		context('SemanticNodeOperation', () => {
			specify('with constant folding on.', () => {
				const nodes: readonly [string, SemanticNodeOperation][] = [
					`!null;`,
					`!false;`,
					`!true;`,
					`!42;`,
					`!4.2;`,
					`!0;`,
					`!0.0;`,
					`?null;`,
					`?false;`,
					`?true;`,
					`?42;`,
					`?4.2;`,
					`?0;`,
					`?0.0;`,
					`42 + 420;`,
					`42 - 420;`,
					`3.0e1 - 201.0e-1;`,
					`3 * 2.1;`,
					` 126 /  3;`,
					`-126 /  3;`,
					` 126 / -3;`,
					`-126 / -3;`,
					` 200 /  3;`,
					` 200 / -3;`,
					`-200 /  3;`,
					`-200 / -3;`,
					`42 == 420;`,
					`42 != 420;`,
					`4.2 == 42;`,
					`42 != 42.0;`,
					`true is 1;`,
					`true == 1;`,
					`null is false;`,
					`null == false;`,
					`false == 0.0;`,
					`false is 0.0;`,
					`0.0 is 0;`,
					`42 && 420;`,
					`4.2 || -420;`,
					`null && 201.0e-1;`,
					`true && 201.0e-1;`,
					`false || null;`,
					`if true  then false   else 2;`,
					`if false then 3.0     else null;`,
					`if true  then 2       else 3.0;`,
					`if false then 2 + 3.0 else 1.0 * 2;`,
					`42 ^ 2 * 420;`,
					`2 ^ 15 + 2 ^ 14;`,
					`-(2 ^ 14) - 2 ^ 15;`,
					`2 * 3 + 5;`,
					`2 * 3 + 5.0;`,
					`-(5) ^ +(2 * 3);`,
				].map((src) => [src, operationFromStatementExpression(
					statementExpressionFromSource(src)
				)])
				assert.deepStrictEqual(
					nodes.map(([src,  node]) => node.build(new Parser(new Screener(src, CONFIG_DEFAULT).generate(), CONFIG_DEFAULT).validator.builder)),
					nodes.map(([_src, node]) => {
						const assess: CompletionStructureAssessment = node.assess()
						assert.ok(!assess.isAbrupt)
						return assess.build()
					}),
					'produces `CompletionStructureAssessment.new(SemanticNodeOperation#assess#value)#build`',
				)
			}).timeout(5000)
			context('with constant folding off.', () => {
				const folding_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						constantFolding: false,
					},
				}
				function buildOperations(tests: ReadonlyMap<string, InstructionExpression>): void {
					assert.deepStrictEqual(
						[...tests.keys()].map((src) => operationFromStatementExpression(
							statementExpressionFromSource(src, folding_off)
						).build(new Parser(new Screener(src, folding_off).generate(), folding_off).validator.builder)),
						[...tests.values()],
					)
				}
				specify('SemanticNodeOperation[operator: NOT | EMP] ::= SemanticNodeConstant', () => {
					buildOperations(new Map<string, InstructionUnop>([
						[`!null;`,  new InstructionUnop(Operator.NOT, instructionConstInt(0n))],
						[`!false;`, new InstructionUnop(Operator.NOT, instructionConstInt(0n))],
						[`!true;`,  new InstructionUnop(Operator.NOT, instructionConstInt(1n))],
						[`!42;`,    new InstructionUnop(Operator.NOT, instructionConstInt(42n))],
						[`!4.2;`,   new InstructionUnop(Operator.NOT, instructionConstFloat(4.2))],
						[`?null;`,  new InstructionUnop(Operator.EMP, instructionConstInt(0n))],
						[`?false;`, new InstructionUnop(Operator.EMP, instructionConstInt(0n))],
						[`?true;`,  new InstructionUnop(Operator.EMP, instructionConstInt(1n))],
						[`?42;`,    new InstructionUnop(Operator.EMP, instructionConstInt(42n))],
						[`?4.2;`,   new InstructionUnop(Operator.EMP, instructionConstFloat(4.2))],
					]))
				})
				specify('SemanticNodeOperation[operator: NEG] ::= SemanticNodeConstant', () => {
					buildOperations(new Map<string, InstructionUnop>([
						[`-(4);`,   new InstructionUnop(Operator.NEG, instructionConstInt(4n))],
						[`-(4.2);`, new InstructionUnop(Operator.NEG, instructionConstFloat(4.2))],
					]))
				})
				specify('SemanticNodeOperation[operator: ADD | MUL] ::= SemanticNodeConstant SemanticNodeConstant', () => {
					buildOperations(new Map([
						[`42 + 420;`, new InstructionBinop(Operator.ADD, instructionConstInt(42n),   instructionConstInt(420n))],
						[`3 * 2.1;`,  new InstructionBinop(Operator.MUL, instructionConstFloat(3.0), instructionConstFloat(2.1))],
					]))
					assert.throws(() => operationFromStatementExpression(
						statementExpressionFromSource(`null + 5;`)
					).build(new Parser(new Screener(`null + 5;`, CONFIG_DEFAULT).generate(), CONFIG_DEFAULT).validator.builder), /Invalid operation./)
				})
				specify('SemanticNodeOperation[operator: DIV] ::= SemanticNodeConstant SemanticNodeConstant', () => {
					buildOperations(xjs.Map.mapValues(new Map([
						[' 126 /  3;', [ 126n,  3n]],
						['-126 /  3;', [-126n,  3n]],
						[' 126 / -3;', [ 126n, -3n]],
						['-126 / -3;', [-126n, -3n]],
						[' 200 /  3;', [ 200n,  3n]],
						[' 200 / -3;', [ 200n, -3n]],
						['-200 /  3;', [-200n,  3n]],
						['-200 / -3;', [-200n, -3n]],
					]), ([a, b]) => new InstructionBinop(
						Operator.DIV,
						instructionConstInt(a),
						instructionConstInt(b),
					)))
				})
				specify('SemanticNodeOperation[operator: IS | EQ] ::= SemanticNodeConstant SemanticNodeConstant', () => {
					assert.deepStrictEqual([
						`42 == 420;`,
						`4.2 == 42;`,
						`true is 1;`,
						`true == 1;`,
						`null is false;`,
						`null == false;`,
						`false == 0.0;`,
					].map((src) => operationFromStatementExpression(
						statementExpressionFromSource(src, folding_off)
					).build(new Parser(new Screener(src, folding_off).generate(), folding_off).validator.builder)), [
						new InstructionBinop(
							Operator.EQ,
							instructionConstInt(42n),
							instructionConstInt(420n),
						),
						new InstructionBinop(
							Operator.EQ,
							instructionConstFloat(4.2),
							instructionConstFloat(42.0),
						),
						new InstructionBinop(
							Operator.IS,
							instructionConstInt(1n),
							instructionConstInt(1n),
						),
						new InstructionBinop(
							Operator.EQ,
							instructionConstInt(1n),
							instructionConstInt(1n),
						),
						new InstructionBinop(
							Operator.IS,
							instructionConstInt(0n),
							instructionConstInt(0n),
						),
						new InstructionBinop(
							Operator.EQ,
							instructionConstInt(0n),
							instructionConstInt(0n),
						),
						new InstructionBinop(
							Operator.EQ,
							instructionConstFloat(0.0),
							instructionConstFloat(0.0),
						),
					])
					assert.throws(() => operationFromStatementExpression(
						statementExpressionFromSource(`42.0 is 42;`, folding_off)
					).build(new Parser(new Screener(`42.0 is 42;`, folding_off).generate(), folding_off).validator.builder), /Both operands must be either integers or floats, but not a mix./, 'IS operator does not coerce to floats')
				})
				specify('SemanticNodeOperation[operator: AND | OR] ::= SemanticNodeConstant SemanticNodeConstant', () => {
					assert.deepStrictEqual([
						`42 && 420;`,
						`4.2 || -420;`,
						`null && 201.0e-1;`,
						`true && 201.0e-1;`,
						`false || null;`,
					].map((src) => operationFromStatementExpression(
						statementExpressionFromSource(src, folding_off)
					).build(new Parser(new Screener(src, folding_off).generate(), folding_off).validator.builder)), [
						new InstructionBinop(
							Operator.AND,
							instructionConstInt(42n),
							instructionConstInt(420n),
						),
						new InstructionBinop(
							Operator.OR,
							instructionConstFloat(4.2),
							instructionConstFloat(-420.0),
						),
						new InstructionBinop(
							Operator.AND,
							instructionConstFloat(0.0),
							instructionConstFloat(20.1),
						),
						new InstructionBinop(
							Operator.AND,
							instructionConstFloat(1.0),
							instructionConstFloat(20.1),
						),
						new InstructionBinop(
							Operator.OR,
							instructionConstInt(0n),
							instructionConstInt(0n),
						),
					])
				})
				specify('ExpressionConditional ::= "if" Expression "then" Expression "else" Expression;', () => {
					buildOperations(xjs.Map.mapValues(new Map([
						[`if true  then false   else 2;`,       [new Int16(1n), new Int16(0n),    new Int16(2n)]],
						[`if false then 3.0     else null;`,    [new Int16(0n), new Float64(3.0), new Float64(0.0)]],
						[`if true  then 2       else 3.0;`,     [new Int16(1n), new Float64(2.0), new Float64(3.0)]],
					]), ([cond, cons, alt]) => new InstructionCond(
						new InstructionConst(cond),
						new InstructionConst(cons),
						new InstructionConst(alt),
					)))
				})
				specify('compound expression.', () => {
					buildOperations(new Map([
						[`42 ^ 2 * 420;`, new InstructionBinop(
							Operator.MUL,
							new InstructionBinop(
								Operator.EXP,
								instructionConstInt(42n),
								instructionConstInt(2n),
							),
							instructionConstInt(420n),
						)],
						[`2 * 3.0 + 5;`, new InstructionBinop(
							Operator.ADD,
							new InstructionBinop(
								Operator.MUL,
								instructionConstFloat(2.0),
								instructionConstFloat(3.0),
							),
							instructionConstFloat(5.0),
						)],
					]))
				})
			})
			specify('multiple statements.', () => {
				const srcs: [string, SolidConfig] = [`42; 420;`, CONFIG_DEFAULT]
				const generator: Builder = new Parser(new Screener(...srcs).generate(), srcs[1]).validator.builder
				new Parser(new Screener(...srcs).generate(), srcs[1]).parse().decorate().children.forEach((stmt, i) => {
					assert.ok(stmt instanceof SemanticNodeStatementExpression)
					assert.deepStrictEqual(
						stmt.build(generator),
						new InstructionStatement(BigInt(i), constantFromStatementExpression(stmt).build(generator)),
					)
				})
			})
		})
	})


	context('SemanticNodeExpression', () => {
		describe('#type', () => {
			function typeOperations(tests: ReadonlyMap<string, SolidObject>): void {
				assert.deepStrictEqual([...tests.keys()].map((src) => operationFromStatementExpression(
					statementExpressionFromSource(src)
				).type()), [...tests.values()].map((result) => new SolidTypeConstant(result)))
			}
			context('with int coercion off.', () => {
				const coercion_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						intCoercion: false,
					},
				}
				describe('SemanticNodeOperationBinaryArithmetic', () => {
					it('returns `Integer` if both operands are ints.', () => {
						assert.deepStrictEqual(operationFromStatementExpression(
							statementExpressionFromSource(`7 * 3;`, coercion_off)
						).type(false, false), Int16)
					})
					it('returns `Float` if both operands are floats.', () => {
						assert.deepStrictEqual(operationFromStatementExpression(
							statementExpressionFromSource(`7.0 - 3.0;`, coercion_off)
						).type(false, false), Float64)
					})
				})
				describe('SemanticNodeOperationBinaryComparative', () => {
					it('returns `Boolean` if both operands are of the same numeric type.', () => {
						assert.deepStrictEqual(operationFromStatementExpression(
							statementExpressionFromSource(`7 < 3;`, coercion_off)
						).type(false, false), SolidBoolean)
						assert.deepStrictEqual(operationFromStatementExpression(
							statementExpressionFromSource(`7.0 >= 3.0;`, coercion_off)
						).type(false, false), SolidBoolean)
					})
					it('throws TypeError if operands have different types.', () => {
					})
				})
				describe('SemanticNodeOperationBinaryEquality[operator=EQ]', () => {
					it('returns `false` if operands are of different numeric types.', () => {
						assert.deepStrictEqual(operationFromStatementExpression(
							statementExpressionFromSource(`7 == 7.0;`, coercion_off)
						).type(false, false), new SolidTypeConstant(SolidBoolean.FALSE))
					})
				})
			})
			context('with constant folding on, with int coersion on.', () => {
				context('SemanticNodeConstant', () => {
					it('returns a constant Null type for SemanticNodeConstant with null value.', () => {
						assert.deepStrictEqual(constantFromStatementExpression(
							statementExpressionFromSource(`null;`)
						).type(), new SolidTypeConstant(SolidNull.NULL))
					})
					it('returns a constant Boolean type for SemanticNodeConstant with bool value.', () => {
						assert.deepStrictEqual([
							`false;`,
							`true;`,
						].map((src) => constantFromStatementExpression(
							statementExpressionFromSource(src)
						).type()), [
							new SolidTypeConstant(SolidBoolean.FALSE),
							new SolidTypeConstant(SolidBoolean.TRUE),
						])
					})
					it('returns a constant Integer type for SemanticNodeConstant with integer value.', () => {
						assert.deepStrictEqual(constantFromStatementExpression(
							statementExpressionFromSource(`42;`)
						).type(), new SolidTypeConstant(new Int16(42n)))
					})
					it('returns a constant Float type for SemanticNodeConstant with float value.', () => {
						assert.deepStrictEqual(constantFromStatementExpression(
							statementExpressionFromSource(`4.2e+1;`)
						).type(), new SolidTypeConstant(new Float64(42.0)))
					})
					Dev.supports('variables') && it('throws for identifiers.', () => {
						assert.throws(() => ((new Parser(new Screener(`x;`, CONFIG_DEFAULT).generate(), CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeIdentifier).type(), /Not yet supported./)
					})
					it('returns `String` for SemanticNodeConstant with string value.', () => {
						;[
							...(Dev.supports('literalString') ? [
								constantFromStatementExpression(
									statementExpressionFromSource(`'42';`)
								),
							] : []),
							...(Dev.supports('literalTemplate') ? [
								(new Parser(new Screener(`'''42''';`, CONFIG_DEFAULT).generate(), CONFIG_DEFAULT).parse().decorate()
									.children[0] as SemanticNodeStatementExpression)
									.children[0] as SemanticNodeTemplate,
								(new Parser(new Screener(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`, CONFIG_DEFAULT).generate(), CONFIG_DEFAULT).parse().decorate()
									.children[0] as SemanticNodeStatementExpression)
									.children[0] as SemanticNodeTemplate,
							] : []),
						].forEach((node) => {
							assert.strictEqual(node.type(), SolidString)
						})
					})
				})
				context('SemanticNodeOperationBinaryArithmetic', () => {
					it('returns a constant Integer type for any operation of integers.', () => {
						assert.deepStrictEqual(operationFromStatementExpression(
							statementExpressionFromSource(`7 * 3 * 2;`)
						).type(), new SolidTypeConstant(new Int16(7n * 3n * 2n)))
					})
					it('returns a constant Float type for any operation of mix of integers and floats.', () => {
						assert.deepStrictEqual(operationFromStatementExpression(
							statementExpressionFromSource(`3.0 * 2.7;`)
						).type(), new SolidTypeConstant(new Float64(3.0 * 2.7)))
						assert.deepStrictEqual(operationFromStatementExpression(
							statementExpressionFromSource(`7 * 3.0 * 2;`)
						).type(), new SolidTypeConstant(new Float64(7 * 3.0 * 2)))
					})
				})
			})
			context('with constant folding off, with int coersion on.', () => {
				const folding_off: SolidConfig = {
					...CONFIG_DEFAULT,
					compilerOptions: {
						...CONFIG_DEFAULT.compilerOptions,
						constantFolding: false,
					},
				}
				context('SemanticNodeOperationBinaryArithmetic', () => {
					it('returns Integer for integer arithmetic.', () => {
						const node: SemanticNodeOperation = operationFromStatementExpression(
							statementExpressionFromSource(`(7 + 3) * 2;`, folding_off)
						)
						assert.deepStrictEqual(
							[node.type(false), node.children.length],
							[Int16,            2],
						)
						assert.deepStrictEqual(
							[node.children[0].type(false), node.children[1].type(false)],
							[Int16,                        Int16],
						)
					})
					it('returns Float for float arithmetic.', () => {
						const node: SemanticNodeOperation = operationFromStatementExpression(
							statementExpressionFromSource(`7 * 3.0 ^ 2;`, folding_off)
						)
						assert.deepStrictEqual(
							[node.type(false), node.children.length],
							[Float64,          2],
						)
						assert.deepStrictEqual(
							[node.children[0].type(false), node.children[1].type(false)],
							[Int16,                        Float64],
						)
					})
				})
				it('allows coercing of ints to floats if there are any floats.', () => {
					assert.deepStrictEqual(operationFromStatementExpression(
						statementExpressionFromSource(`7.0 > 3;`)
					).type(false, true), SolidBoolean)
					assert.deepStrictEqual(operationFromStatementExpression(
						statementExpressionFromSource(`7 == 7.0;`)
					).type(false, true), SolidBoolean)
				})
			})
			it('returns a constant Boolean type for boolean unary operation of anything.', () => {
				typeOperations(xjs.Map.mapValues(new Map([
					[`!false;`,  true],
					[`!true;`,   false],
					[`!null;`,   true],
					[`!42;`,     false],
					[`!4.2e+1;`, false],
					[`?false;`,  true],
					[`?true;`,   false],
					[`?null;`,   true],
					[`?42;`,     false],
					[`?4.2e+1;`, false],
				]), (v) => SolidBoolean.fromBoolean(v)))
			})
			it('computes type for equality and comparison.', () => {
				typeOperations(xjs.Map.mapValues(new Map([
					[`2 < 3;`,    true],
					[`2 > 3;`,    false],
					[`2 <= 3;`,   true],
					[`2 >= 3;`,   false],
					[`2 !< 3;`,   false],
					[`2 !> 3;`,   true],
					[`2 is 3;`,   false],
					[`2 isnt 3;`, true],
					[`2 == 3;`,   false],
					[`2 != 3;`,   true],
					[`0 is -0;`,     true],
					[`0 == -0;`,     true],
					[`0.0 is 0;`,    false],
					[`0.0 == 0;`,    true],
					[`0.0 is -0;`,   false],
					[`0.0 == -0;`,   true],
					[`-0.0 is 0;`,   false],
					[`-0.0 == 0;`,   true],
					[`-0.0 is 0.0;`, false],
					[`-0.0 == 0.0;`, true],
				]), (v) => SolidBoolean.fromBoolean(v)))
			})
			it('computes type for AND and OR.', () => {
				typeOperations(new Map<string, SolidObject>([
					[`null  && false;`, SolidNull.NULL],
					[`false && null;`,  SolidBoolean.FALSE],
					[`true  && null;`,  SolidNull.NULL],
					[`false && 42;`,    SolidBoolean.FALSE],
					[`4.2   && true;`,  SolidBoolean.TRUE],
					[`null  || false;`, SolidBoolean.FALSE],
					[`false || null;`,  SolidNull.NULL],
					[`true  || null;`,  SolidBoolean.TRUE],
					[`false || 42;`,    new Int16(42n)],
					[`4.2   || true;`,  new Float64(4.2)],
				]))
			})
			it('computes type for for conditionals', () => {
				typeOperations(new Map<string, SolidObject>([
					[`if true then false else 2;`,          SolidBoolean.FALSE],
					[`if false then 3.0 else null;`,        SolidNull.NULL],
					[`if true then 2 else 3.0;`,            new Int16(2n)],
					[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
				]))
			})
			it('throws for numeric operation of non-numbers.', () => {
				[
					`null + 5;`,
					`5 * null;`,
					`false - 2;`,
					`2 / true;`,
					`null ^ false;`,
					...(Dev.supports('literalString') ? [`'hello' + 5;`] : []),
				].forEach((src) => {
					assert.throws(() => operationFromStatementExpression(
						statementExpressionFromSource(src)
					).type(), /Invalid operation./)
				})
			})
		})

		describe('#assess', () => {
			function assessOperations(tests: Map<string, SolidObject>): void {
				assert.deepStrictEqual([...tests.keys()].map((src) => operationFromStatementExpression(
					statementExpressionFromSource(src)
				).assess()), [...tests.values()].map((result) => new CompletionStructureAssessment(result)))
			}
			it('computes the value of constant null or boolean expression.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
				].map((src) => constantFromStatementExpression(
					statementExpressionFromSource(src)
				).assess()), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
				].map((v) => new CompletionStructureAssessment(v)))
			})
			it('computes the value of a constant float expression.', () => {
				assert.deepStrictEqual(`
					55.  -55.  033.  -033.  2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => constantFromStatementExpression(
					statementExpressionFromSource(`${ src };`)
				).assess()), [
					55, -55, 33, -33, 2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, -0, 6.8, 6.8, 0, -0,
				].map((v) => new CompletionStructureAssessment(new Float64(v))))
			})
			it('computes the value of a logical negation of anything.', () => {
				assessOperations(new Map([
					[`!false;`,  SolidBoolean.TRUE],
					[`!true;`,   SolidBoolean.FALSE],
					[`!null;`,   SolidBoolean.TRUE],
					[`!0;`,      SolidBoolean.FALSE],
					[`!42;`,     SolidBoolean.FALSE],
					[`!0.0;`,    SolidBoolean.FALSE],
					[`!-0.0;`,   SolidBoolean.FALSE],
					[`!4.2e+1;`, SolidBoolean.FALSE],
				]))
			})
			it('computes the value of emptiness of anything.', () => {
				assessOperations(new Map([
					[`?false;`,  SolidBoolean.TRUE],
					[`?true;`,   SolidBoolean.FALSE],
					[`?null;`,   SolidBoolean.TRUE],
					[`?0;`,      SolidBoolean.TRUE],
					[`?42;`,     SolidBoolean.FALSE],
					[`?0.0;`,    SolidBoolean.TRUE],
					[`?-0.0;`,   SolidBoolean.TRUE],
					[`?4.2e+1;`, SolidBoolean.FALSE],
				]))
			})
			it('computes the value of an integer operation of constants.', () => {
				assessOperations(xjs.Map.mapValues(new Map([
					[`42 + 420;`,           42 + 420],
					[`42 - 420;`,           42 + -420],
					[` 126 /  3;`,          Math.trunc( 126 /  3)],
					[`-126 /  3;`,          Math.trunc(-126 /  3)],
					[` 126 / -3;`,          Math.trunc( 126 / -3)],
					[`-126 / -3;`,          Math.trunc(-126 / -3)],
					[` 200 /  3;`,          Math.trunc( 200 /  3)],
					[` 200 / -3;`,          Math.trunc( 200 / -3)],
					[`-200 /  3;`,          Math.trunc(-200 /  3)],
					[`-200 / -3;`,          Math.trunc(-200 / -3)],
					[`42 ^ 2 * 420;`,       (42 ** 2 * 420) % (2 ** 16)],
					[`2 ^ 15 + 2 ^ 14;`,    -(2 ** 14)],
					[`-(2 ^ 14) - 2 ^ 15;`, 2 ** 14],
					[`-(5) ^ +(2 * 3);`,    (-(5)) ** +(2 * 3)],
				]), (val) => new Int16(BigInt(val))))
			})
			it('overflows integers properly.', () => {
				assert.deepStrictEqual([
					`2 ^ 15 + 2 ^ 14;`,
					`-(2 ^ 14) - 2 ^ 15;`,
				].map((src) => operationFromStatementExpression(
					statementExpressionFromSource(src)
				).assess()), [
					new CompletionStructureAssessment(new Int16(-(2n ** 14n))),
					new CompletionStructureAssessment(new Int16(2n ** 14n)),
				])
			})
			it('computes the value of a float operation of constants.', () => {
				assessOperations(new Map<string, SolidObject>([
					[`3.0e1 - 201.0e-1;`,     new Float64(30 - 20.1)],
					[`3 * 2.1;`,     new Float64(3 * 2.1)],
				]))
			})
			it('should throw when performing an operation that does not yield a valid number.', () => {
				assert.throws(() => operationFromStatementExpression(
					statementExpressionFromSource(`-4 ^ -0.5;`)
				).assess(), NanError01)
			})
			it('computes the value of comparison operators.', () => {
				assessOperations(xjs.Map.mapValues(new Map([
					[`3 <  3;`,     false],
					[`3 >  3;`,     false],
					[`3 <= 3;`,     true],
					[`3 >= 3;`,     true],
					[`5.2 <  7.0;`, true],
					[`5.2 >  7.0;`, false],
					[`5.2 <= 7.0;`, true],
					[`5.2 >= 7.0;`, false],
					[`5.2 <  9;`, true],
					[`5.2 >  9;`, false],
					[`5.2 <= 9;`, true],
					[`5.2 >= 9;`, false],
					[`5 <  9.2;`, true],
					[`5 >  9.2;`, false],
					[`5 <= 9.2;`, true],
					[`5 >= 9.2;`, false],
					[`3.0 <  3;`, false],
					[`3.0 >  3;`, false],
					[`3.0 <= 3;`, true],
					[`3.0 >= 3;`, true],
					[`3 <  3.0;`, false],
					[`3 >  3.0;`, false],
					[`3 <= 3.0;`, true],
					[`3 >= 3.0;`, true],
				]), (val) => SolidBoolean.fromBoolean(val)))
			})
			it('computes the value of IS and EQ operators.', () => {
				assessOperations(xjs.Map.mapValues(new Map([
					[`null is null;`, true],
					[`null == null;`, true],
					[`null is 5;`,    false],
					[`null == 5;`,    false],
					[`true is 1;`,    false],
					[`true == 1;`,    false],
					[`true is 1.0;`,  false],
					[`true == 1.0;`,  false],
					[`true is 5.1;`,  false],
					[`true == 5.1;`,  false],
					[`true is true;`, true],
					[`true == true;`, true],
					[`3.0 is 3;`,     false],
					[`3.0 == 3;`,     true],
					[`3 is 3.0;`,     false],
					[`3 == 3.0;`,     true],
					[`0.0 is 0.0;`,   true],
					[`0.0 == 0.0;`,   true],
					[`0.0 is -0.0;`,  false],
					[`0.0 == -0.0;`,  true],
					[`0 is -0;`,     true],
					[`0 == -0;`,     true],
					[`0.0 is 0;`,    false],
					[`0.0 == 0;`,    true],
					[`0.0 is -0;`,   false],
					[`0.0 == -0;`,   true],
					[`-0.0 is 0;`,   false],
					[`-0.0 == 0;`,   true],
					[`-0.0 is 0.0;`, false],
					[`-0.0 == 0.0;`, true],
				]), (val) => SolidBoolean.fromBoolean(val)))
			})
			it('computes the value of AND and OR operators.', () => {
				assessOperations(new Map<string, SolidObject>([
					[`null && 5;`,     SolidNull.NULL],
					[`null || 5;`,     new Int16(5n)],
					[`5 && null;`,     SolidNull.NULL],
					[`5 || null;`,     new Int16(5n)],
					[`5.1 && true;`,   SolidBoolean.TRUE],
					[`5.1 || true;`,   new Float64(5.1)],
					[`3.1 && 5;`,      new Int16(5n)],
					[`3.1 || 5;`,      new Float64(3.1)],
					[`false && null;`, SolidBoolean.FALSE],
					[`false || null;`, SolidNull.NULL],
				]))
			})
			it('computes the value of a conditional expression.', () => {
				assessOperations(new Map<string, SolidObject>([
					[`if true then false else 2;`,          SolidBoolean.FALSE],
					[`if false then 3.0 else null;`,        SolidNull.NULL],
					[`if true then 2 else 3.0;`,            new Int16(2n)],
					[`if false then 2 + 3.0 else 1.0 * 2;`, new Float64(2.0)],
				]))
			})
		})
	})
})
