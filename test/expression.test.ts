import * as assert from 'assert'

import Parser from '../src/class/Parser.class'

import {SemanticNodeGoal_compileOutput} from './compile.test'



test('Compile expression unit.', () => {
	assert.strictEqual(new Parser('42;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`
		STACK.push(42)
	`))
})



test('Compile additive.', () => {
	assert.strictEqual(new Parser('42 + 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)

STACK.push(420)

STACK.push(ADD)
	`))
})



test('Compile file subtractive.', () => {
	assert.strictEqual(new Parser('42 - 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)

STACK.push(420)

STACK.push(NEG)

STACK.push(ADD)
	`))
})



test('Compile compound expression.', () => {
	assert.strictEqual(new Parser('42 ^ 2 * 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`


STACK.push(42)

STACK.push(2)

STACK.push(EXP)

STACK.push(420)

STACK.push(MUL)
	`))
})



test('Compile compound expression, grouping.', () => {
	assert.strictEqual(new Parser('42 ^ (2 * 420);').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)

STACK.push(2)

STACK.push(420)

STACK.push(MUL)

STACK.push(EXP)
	`))
})
