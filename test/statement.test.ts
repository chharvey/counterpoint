import * as assert from 'assert'

import Parser from '../src/class/Parser.class'

import {SemanticNodeGoal_compileOutput} from './compile.test'



suite('Empty statements.', () => {
	test('Compile empty statement.', () => {
		assert.strictEqual(new Parser(';').parse().decorate().compile(), SemanticNodeGoal_compileOutput(''))
	})
})
