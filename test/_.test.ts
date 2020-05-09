import * as assert from 'assert'

import Util     from '../src/class/Util.class'
import Parser   from '../src/class/Parser.class'
import {
	TokenFilebound,
} from '../src/class/Token.class'
import type ParseNode from '../src/class/ParseNode.class'



suite('Empty file.', () => {
	test('Parse empty file.', () => {
		const tree: ParseNode = new Parser('').parse()
		assert.strictEqual(tree.tagname, 'Goal')
		assert.strictEqual(tree.children.length, 2)
		tree.children.forEach((child) => assert.ok(child instanceof TokenFilebound))
	})

	test('Decorate empty file.', () => {
		assert.strictEqual(new Parser('').parse().decorate().tagname, 'Null')
	})

	test('Compile empty file.', () => {
		assert.strictEqual(new Parser('').parse().decorate().compile(), Util.dedent(`
			export default null
		`))
	})
})
