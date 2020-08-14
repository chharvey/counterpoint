import * as assert from 'assert'

import SolidConfig, {CONFIG_DEFAULT} from '../src/SolidConfig'
import Dev from '../src/class/Dev.class'
import Parser from '../src/class/Parser.class'
import type {
	ParseNodeExpression,
	ParseNodeStatement,
	ParseNodeGoal__0__List,
} from '../src/class/ParseNode.class'
import {
	SemanticNodeConstant,
	SemanticNodeIdentifier,
	SemanticNodeTemplate,
	SemanticNodeOperation,
	SemanticNodeStatementExpression,
} from '../src/class/SemanticNode.class'
import {
	CompletionStructureAssessment,
} from '../src/spec/CompletionStructure.class'
import Builder from '../src/vm/Builder.class'
import {SolidTypeUnion} from '../src/vm/SolidLanguageType.class'
import {
	SolidNull,
	SolidBoolean,
	SolidString,
} from '../src/vm/SolidLanguageValue.class'
import Int16 from '../src/vm/Int16.class'
import Float64 from '../src/vm/Float64.class'
import {
	Operator,
	InstructionNone,
	InstructionConst,
	InstructionUnop,
	InstructionBinop,
	InstructionCond,
	InstructionStatement,
	InstructionModule,
} from '../src/vm/Instruction.class'
import {
	instructionConstInt,
	instructionConstFloat,
} from './helpers'
import {
	operationFromStatementExpression,
	statementExpressionFromSource,
} from './helpers-semantic'



describe('SemanticNode', () => {
	describe('#build', () => {
		context('SemanticNodeGoal ::= SOT EOT', () => {
			it('returns InstructionNone.', () => {
				const src: [string, SolidConfig] = [``, CONFIG_DEFAULT]
				const instr: InstructionNone | InstructionModule = new Parser(...src).parse().decorate()
					.build(new Builder(...src))
				assert.ok(instr instanceof InstructionNone)
			})
		})

		context('SemanticNodeStatement ::= ";"', () => {
			it('returns InstructionNone.', () => {
				const src: [string, SolidConfig] = [`;`, CONFIG_DEFAULT]
				const instr: InstructionNone | InstructionStatement = (new Parser(...src).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.build(new Builder(...src))
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
					((new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeConstant)
						.build(new Builder(src, CONFIG_DEFAULT))
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
			specify('SemanticNodeOperation[operator: NOT | EMP] ::= SemanticNodeConstant', () => {
				assert.deepStrictEqual([
					`!null;`,
					`!false;`,
					`!true;`,
					`!42;`,
					`!4.2;`,
					`?null;`,
					`?false;`,
					`?true;`,
					`?42;`,
					`?4.2;`,
				].map((src) => ((new Parser(src, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation
				).build(new Builder(src, CONFIG_DEFAULT))), [
					new InstructionUnop(Operator.NOT, instructionConstInt(0n)),
					new InstructionUnop(Operator.NOT, instructionConstInt(0n)),
					new InstructionUnop(Operator.NOT, instructionConstInt(1n)),
					new InstructionUnop(Operator.NOT, instructionConstInt(42n)),
					new InstructionUnop(Operator.NOT, instructionConstFloat(4.2)),
					new InstructionUnop(Operator.EMP, instructionConstInt(0n)),
					new InstructionUnop(Operator.EMP, instructionConstInt(0n)),
					new InstructionUnop(Operator.EMP, instructionConstInt(1n)),
					new InstructionUnop(Operator.EMP, instructionConstInt(42n)),
					new InstructionUnop(Operator.EMP, instructionConstFloat(4.2)),
				])
			})
			specify('SemanticNodeOperation[operator: ADD | SUB | MUL] ::= SemanticNodeConstant SemanticNodeConstant', () => {
				assert.deepStrictEqual([
					`42 + 420;`,
					`42 - 420;`,
					`3.0e1 - 201.0e-1;`,
					`3 * 2.1;`,
				].map((src) => (
					(new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(src, CONFIG_DEFAULT))), [
					new InstructionBinop(
						Operator.ADD,
						instructionConstInt(42n),
						instructionConstInt(420n),
					),
					new InstructionBinop(
						Operator.ADD,
						instructionConstInt(42n),
						instructionConstInt(-420n),
					),
					new InstructionBinop(
						Operator.ADD,
						instructionConstFloat(30.0),
						instructionConstFloat(-20.1),
					),
					new InstructionBinop(
						Operator.MUL,
						instructionConstFloat(3.0),
						instructionConstFloat(2.1),
					),
				])
			})
			specify('SemanticNodeOperation[operator: DIV] ::= SemanticNodeConstant SemanticNodeConstant', () => {
				assert.deepStrictEqual([
					' 126 /  3;',
					'-126 /  3;',
					' 126 / -3;',
					'-126 / -3;',
					' 200 /  3;',
					' 200 / -3;',
					'-200 /  3;',
					'-200 / -3;',
				].map((src) => (
					(new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(src, CONFIG_DEFAULT))), [
					[ 126n,  3n],
					[-126n,  3n],
					[ 126n, -3n],
					[-126n, -3n],
					[ 200n,  3n],
					[ 200n, -3n],
					[-200n,  3n],
					[-200n, -3n],
				].map(([a, b]) => new InstructionBinop(
					Operator.DIV,
					instructionConstInt(a),
					instructionConstInt(b),
				)))
			})
			specify('SemanticNodeOperation[operator: AND | OR] ::= SemanticNodeConstant SemanticNodeConstant', () => {
				assert.deepStrictEqual([
					`42 && 420;`,
					`4.2 || -420;`,
					`null && 201.0e-1;`,
					`true && 201.0e-1;`,
					`false || null;`,
				].map((src) => operationFromStatementExpression(statementExpressionFromSource(src)).build(new Builder(src, CONFIG_DEFAULT))), [
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
				assert.deepStrictEqual([
					`if true  then false   else 2;`,
					`if false then 3.0     else null;`,
					`if true  then 2       else 3.0;`,
					`if false then 2 + 3.0 else 1.0 * 2;`,
				].map((src) => operationFromStatementExpression(statementExpressionFromSource(src)).build(new Builder(src, CONFIG_DEFAULT))), ([
					[new Int16(1n), new Int16(0n),    new Int16(2n)],
					[new Int16(0n), new Float64(3.0), new Float64(0.0)],
					[new Int16(1n), new Float64(2.0), new Float64(3.0)],
					[new Int16(0n), new Float64(5.0), new Float64(2.0)],
				])
					.map((arr) => arr.map((v) => new InstructionConst(v)))
					.map(([cond, cons, alt]) => new InstructionCond(cond, cons, alt))
				)
			})
			specify('compound expression.', () => {
				const srcs: [string, SolidConfig] = [`42 ^ 2 * 420;`, CONFIG_DEFAULT]
				assert.deepStrictEqual((
					(new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(...srcs)), new InstructionBinop(
					Operator.MUL,
					instructionConstInt(42n ** 2n),
					instructionConstInt(420n),
				))
			})
			specify('overflow.', () => {
				assert.deepStrictEqual([
					`2 ^ 15 + 2 ^ 14;`,
					`-(2 ^ 14) - 2 ^ 15;`,
				].map((src) => (
					(new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(src, CONFIG_DEFAULT))), [
					[-(2n ** 15n) /* negative becuase of overflow */, 2n ** 14n],
					[-(2n ** 14n), -(2n ** 15n)],
				].map(([a, b]) => new InstructionBinop(
					Operator.ADD,
					instructionConstInt(a),
					instructionConstInt(b),
				)))
			})
			specify('compound expression.', () => {
				assert.deepStrictEqual([
					`2 * 3 + 5;`,
					`2 * 3 + 5.0;`,
				].map((src) => (
					(new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(src, CONFIG_DEFAULT))), [
					new InstructionBinop(
						Operator.ADD,
						instructionConstInt(6n),
						instructionConstInt(5n),
					),
					new InstructionBinop(
						Operator.ADD,
						instructionConstFloat(6.0),
						instructionConstFloat(5.0),
					),
				])
			})
			specify('compound expression with grouping.', () => {
				const srcs: [string, SolidConfig] = [`-(5) ^ +(2 * 3);`, CONFIG_DEFAULT]
				assert.deepStrictEqual((
					(new Parser(...srcs).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation
				).build(new Builder(...srcs)), new InstructionBinop(
					Operator.EXP,
					instructionConstInt(-5n),
					instructionConstInt(2n * 3n),
				))
			})
			specify('multiple statements.', () => {
				const srcs: [string, SolidConfig] = [`42; 420;`, CONFIG_DEFAULT]
				const generator: Builder = new Builder(...srcs)
				new Parser(...srcs).parse().decorate().children.forEach((stmt, i) => {
					assert.ok(stmt instanceof SemanticNodeStatementExpression)
					assert.deepStrictEqual(stmt.build(generator), new InstructionStatement(BigInt(i), instructionConstInt([
						42n,
						420n,
					][i])))
				})
			})
		})
	})


	context('SemanticNodeExpression', () => {
		describe('#type', () => {
			it('returns `Null` for SemanticNodeConstant with null value.', () => {
				assert.strictEqual(((new Parser(`null;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), SolidNull)
			})
			it('returns `Boolean` for SemanticNodeConstant with bool value.', () => {
				[
					`false;`,
					`true;`,
				].forEach((src) => {
					assert.strictEqual(((new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeConstant).type(), SolidBoolean)
				})
			})
			it('returns `Integer` for SemanticNodeConstant with integer value.', () => {
				assert.strictEqual(((new Parser(`42;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), Int16)
			})
			it('returns `Float` for SemanticNodeConstant with float value.', () => {
				assert.strictEqual(((new Parser(`4.2e+1;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeConstant).type(), Float64)
			})
			Dev.supports('variables') && it('throws for identifiers.', () => {
				assert.throws(() => ((new Parser(`x;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeIdentifier).type(), /Not yet supported./)
			})
			it('returns `String` for SemanticNodeConstant with string value.', () => {
				;[
					...(Dev.supports('literalString') ? [
						(new Parser(`'42';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeConstant,
					] : []),
					...(Dev.supports('literalTemplate') ? [
						(new Parser(`'''42''';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeTemplate,
						(new Parser(`'''the answer is {{ 7 * 3 * 2 }} but what is the question?''';`, CONFIG_DEFAULT).parse().decorate()
							.children[0] as SemanticNodeStatementExpression)
							.children[0] as SemanticNodeTemplate,
					] : []),
				].forEach((node) => {
					assert.strictEqual(node.type(), SolidString)
				})
			})
			it('returns `Boolean` for boolean unary operation of anything.', () => {
				;[
					`!false;`,
					`!true;`,
					`!null;`,
					`!42;`,
					`!4.2e+1;`,
					`?false;`,
					`?true;`,
					`?null;`,
					`?42;`,
					`?4.2e+1;`,
				].forEach((src) => {
					assert.strictEqual(((new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation).type(), SolidBoolean)
				})
			})
			it('returns `Integer` for any operation of integers.', () => {
				assert.strictEqual(((new Parser(`7 * 3 * 2;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).type(), Int16)
			})
			it('returns `Float` for any operation of mix of integers and floats.', () => {
				assert.strictEqual(((new Parser(`3.0 * 2.7;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).type(), Float64)
				assert.strictEqual(((new Parser(`7 * 3.0 * 2;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).type(), Float64)
			})
			it('computes type for AND and OR.', () => {
				assert.deepStrictEqual([
					`null  && false;`,
					`false && null;`,
					`true  && null;`,
					`false && 42;`,
					`4.2   && true;`,
					`null  || false;`,
					`false || null;`,
					`true  || null;`,
					`false || 42;`,
					`4.2   || true;`,
				].map((src) => ((new Parser(src, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
					.type()
				), [
					SolidNull,
					new SolidTypeUnion(SolidBoolean, SolidNull),
					new SolidTypeUnion(SolidBoolean, SolidNull),
					new SolidTypeUnion(SolidBoolean, Int16),
					new SolidTypeUnion(Float64, SolidBoolean),
					SolidBoolean,
					new SolidTypeUnion(SolidBoolean, SolidNull),
					new SolidTypeUnion(SolidBoolean, SolidNull),
					new SolidTypeUnion(SolidBoolean, Int16),
					new SolidTypeUnion(Float64, SolidBoolean),
				])
			})
			it('returns `A | B` for conditionals', () => {
				assert.deepStrictEqual([
					`if true then false else 2;`,
					`if false then 3.0 else null;`,
					`if true then 2 else 3.0;`,
					`if false then 2 + 3.0 else 1.0 * 2;`,
				].map((src) => ((new Parser(src, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
					.type()
				), [
					new SolidTypeUnion(SolidBoolean, Int16),
					new SolidTypeUnion(Float64, SolidNull),
					new SolidTypeUnion(Int16, Float64),
					new SolidTypeUnion(Float64, Float64),
				])
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
					assert.throws(() => ((new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation).type(), /Invalid operation./)
				})
			})
		})

		describe('#assess', () => {
			it('computes the value of constant null or boolean expression.', () => {
				assert.deepStrictEqual([
					'null;',
					'false;',
					'true;',
				].map((src) => {
					const assess: CompletionStructureAssessment | null = (((new Parser(src, CONFIG_DEFAULT).parse()
						.children[1] as ParseNodeGoal__0__List)
						.children[0] as ParseNodeStatement)
						.children[0] as ParseNodeExpression
					).decorate().assess()
					assert.ok(assess)
					return assess.value
				}), [
					SolidNull.NULL,
					SolidBoolean.FALSE,
					SolidBoolean.TRUE,
				])
			})
			it('computes the value of a logical negation of anything.', () => {
				assert.deepStrictEqual([
					`!false;`,
					`!true;`,
					`!null;`,
					`!0;`,
					`!42;`,
					`!0.0;`,
					`!-0.0;`,
					`!4.2e+1;`,
				].map((src) => {
					const assess: CompletionStructureAssessment | null = ((new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation).assess()
					assert.ok(assess)
					assert.ok(assess.value instanceof SolidBoolean)
					return assess
				}), [
					true,
					false,
					true,
					false,
					false,
					false,
					false,
					false,
				].map((b) => new CompletionStructureAssessment(SolidBoolean.fromBoolean(b))))
			})
			it('computes the value of emptiness of anything.', () => {
				assert.deepStrictEqual([
					`?false;`,
					`?true;`,
					`?null;`,
					`?0;`,
					`?42;`,
					`?0.0;`,
					`?-0.0;`,
					`?4.2e+1;`,
				].map((src) => {
					const assess: CompletionStructureAssessment | null = ((new Parser(src, CONFIG_DEFAULT).parse().decorate()
						.children[0] as SemanticNodeStatementExpression)
						.children[0] as SemanticNodeOperation).assess()
					assert.ok(assess)
					assert.ok(assess.value instanceof SolidBoolean)
					return assess
				}), [
					true,
					false,
					true,
					true,
					false,
					true,
					true,
					false,
				].map((b) => new CompletionStructureAssessment(SolidBoolean.fromBoolean(b))))
			})
			it('computes the value of an integer operation of constants.', () => {
				assert.deepStrictEqual([
					'42 + 420;',
					'42 - 420;',
					' 126 /  3;',
					'-126 /  3;',
					' 126 / -3;',
					'-126 / -3;',
					' 200 /  3;',
					' 200 / -3;',
					'-200 /  3;',
					'-200 / -3;',
					'42 ^ 2 * 420;',
					'2 ^ 15 + 2 ^ 14;',
					'-(2 ^ 14) - 2 ^ 15;',
					'-(5) ^ +(2 * 3);',
				].map((src) => {
					const assess: CompletionStructureAssessment | null = (((new Parser(src, CONFIG_DEFAULT).parse()
						.children[1] as ParseNodeGoal__0__List)
						.children[0] as ParseNodeStatement)
						.children[0] as ParseNodeExpression
					).decorate().assess()
					assert.ok(assess)
					assert.ok(assess.value instanceof Int16)
					return assess
				}), [
					42 + 420,
					42 + -420,
					Math.trunc( 126 /  3),
					Math.trunc(-126 /  3),
					Math.trunc( 126 / -3),
					Math.trunc(-126 / -3),
					Math.trunc( 200 /  3),
					Math.trunc( 200 / -3),
					Math.trunc(-200 /  3),
					Math.trunc(-200 / -3),
					(42 ** 2 * 420) % (2 ** 16),
					-(2 ** 14),
					2 ** 14,
					(-(5)) ** +(2 * 3),
				].map((v) => new CompletionStructureAssessment(new Int16(BigInt(v)))))
			})
			it('computes the value of a constant float expression.', () => {
				assert.deepStrictEqual(`
					55.  -55.  033.  -033.  2.007  -2.007
					91.27e4  -91.27e4  91.27e-4  -91.27e-4
					-0.  -0.0  6.8e+0  6.8e-0  0.0e+0  -0.0e-0
				`.trim().replace(/\n\t+/g, '  ').split('  ').map((src) => {
					const assess: CompletionStructureAssessment | null = (((new Parser(`${ src };`, CONFIG_DEFAULT).parse()
						.children[1] as ParseNodeGoal__0__List)
						.children[0] as ParseNodeStatement)
						.children[0] as ParseNodeExpression
					).decorate().assess()
					assert.ok(assess)
					assert.ok(assess.value instanceof Float64)
					return assess
				}), [
					55, -55, 33, -33, 2.007, -2.007,
					91.27e4, -91.27e4, 91.27e-4, -91.27e-4,
					-0, -0, 6.8, 6.8, 0, -0,
				].map((v) => new CompletionStructureAssessment(new Float64(v))))
			})
			it('computes the value of a float operation of constants.', () => {
				assert.deepStrictEqual(((new Parser(`3.0e1 - 201.0e-1;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).assess(), new CompletionStructureAssessment(new Float64(30 - 20.1)))
				assert.deepStrictEqual(((new Parser(`3 * 2.1;`, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation).assess(), new CompletionStructureAssessment(new Float64(3 * 2.1)))
			})
			it('computes the value of AND and OR operators.', () => {
				assert.deepStrictEqual([
					`null && 5;`,
					`null || 5;`,
					`5 && null;`,
					`5 || null;`,
					`5.1 && true;`,
					`5.1 || true;`,
					`3.1 && 5;`,
					`3.1 || 5;`,
					`false && null;`,
					`false || null;`,
				].map((src) => {
					const assess: CompletionStructureAssessment | null = operationFromStatementExpression(statementExpressionFromSource(src)).assess()
					assert.ok(assess)
					return assess
				}), [
					SolidNull.NULL,
					new Int16(5n),
					SolidNull.NULL,
					new Int16(5n),
					SolidBoolean.TRUE,
					new Float64(5.1),
					new Int16(5n),
					new Float64(3.1),
					SolidBoolean.FALSE,
					SolidNull.NULL,
				].map((v) => new CompletionStructureAssessment(v)))
			})
			it('computes the value of a conditional expression.', () => {
				assert.deepStrictEqual([
					`if true then false else 2;`,
					`if false then 3.0 else null;`,
					`if true then 2 else 3.0;`,
					`if false then 2 + 3.0 else 1.0 * 2;`,
				].map((src) => ((new Parser(src, CONFIG_DEFAULT).parse().decorate()
					.children[0] as SemanticNodeStatementExpression)
					.children[0] as SemanticNodeOperation)
					.assess()
				), [
					new CompletionStructureAssessment(SolidBoolean.FALSE),
					new CompletionStructureAssessment(SolidNull.NULL),
					new CompletionStructureAssessment(new Int16(2n)),
					new CompletionStructureAssessment(new Float64(2.0)),
				])
			})
		})
	})
})
