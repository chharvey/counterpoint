import * as assert from 'assert'

import Util     from '../src/class/Util.class'
import Scanner  from '../src/class/Scanner.class'
import Lexer    from '../src/class/Lexer.class'
import Screener from '../src/class/Screener.class'
import Parser   from '../src/class/Parser.class'
import Char, {
	STX,
	ETX,
} from '../src/class/Char.class'
import Token, {
	TokenFilebound,
	TokenWhitespace,
} from '../src/class/Token.class'
import type ParseNode from '../src/class/ParseNode.class'
import {
	LexError01,
} from '../src/error/LexError.class'

const lastItem  = (iter: any): any     => iter[lastIndex(iter)]
const lastIndex = (iter: any): number  => iter.length-1

const mock: string = `
5  +  30 \u000d

6 ^ 2 - 37 *

( 4 * \u000d9 ^ 3

3 - 50 + * 2

5 + 03 + '' * 'hello' *  -2

600  /  3  *  2

600  /  (3  *  2

4 * 2 ^ 3
`.trim()



suite('Scanner.', () => {
	test('Scanner wraps source text.', () => {
		const scanner: Scanner = new Scanner(mock)
		assert.strictEqual(scanner.source_text[0], STX)
		assert.strictEqual(scanner.source_text[1], '\n')
		assert.strictEqual(scanner.source_text[2], '5')
		assert.strictEqual(lastItem(scanner.source_text), ETX)
	})

	test('Scanner normalizes line endings.', () => {
		const scanner: Scanner = new Scanner(mock)
		assert.strictEqual(scanner.source_text[11], '\n')
		assert.strictEqual(scanner.source_text[12], '\n')
		assert.strictEqual(scanner.source_text[13], '6')
		assert.strictEqual(scanner.source_text[33], '\n')
		assert.strictEqual(scanner.source_text[34], '9')
	})

	test('Scanner yields Character objects.', () => {
		const scanner: Scanner = new Scanner(mock)
		const generator: IterableIterator<Char> = scanner.generate()
		let iterator_result: IteratorResult<Char> = generator.next()
		while (!iterator_result.done) {
			assert.ok(iterator_result.value instanceof Char)
			iterator_result = generator.next()
		}
	})

	test('Character source, line, column.', () => {
		const {source, line_index, col_index} = new Char(new Scanner(mock), 21)
		assert.deepStrictEqual([source, line_index + 1, col_index + 1], ['3', 3, 9])
	})

	test('Character lookahead is Char.', () => {
		const lookahead: Char|null = new Char(new Scanner(mock), 23).lookahead()
		assert.ok(lookahead instanceof Char)
		const {source, line_index, col_index} = lookahead !
		assert.deepStrictEqual([source, line_index + 1, col_index + 1], ['*', 3, 12])
	})

	test('Last character lookahead is null.', () => {
		const scanner: Scanner = new Scanner(mock)
		const char: Char = new Char(scanner, lastIndex(scanner.source_text))
		assert.strictEqual(char.source, ETX)
		assert.strictEqual(char.lookahead(), null)
	})
})



suite('Lexer.', () => {
	test('Lexer recognizes `TokenFilebound` conditions.', () => {
		const tokens: Token[] = [...new Lexer(mock).generate()]
		assert.ok(tokens[0] instanceof TokenFilebound)
		assert.strictEqual(tokens[0].source, STX)
		assert.ok(lastItem(tokens) instanceof TokenFilebound)
		assert.strictEqual(lastItem(tokens).source, ETX)
	})

	test('Lexer recognizes `TokenWhitespace` conditions.', () => {
		;[...new Lexer(TokenWhitespace.CHARS.join('')).generate()].slice(1, -1).forEach((value) => {
			assert.ok(value instanceof TokenWhitespace)
		})
	})

	test('Lexer rejects unrecognized characters.', () => {
		`. ~ , [ ] | & ! { } : # $ "`.split(' ').map((c) => new Lexer(`
	5  +  30
	+ 6 ^ - (${c} - 37 *
		`.trim())).forEach((lexer) => {
			assert.throws(() => [...lexer.generate()], LexError01)
		})
	})
})



suite('Screener.', () => {
	test('Screener yields `Token`, non-`TokenWhitespace`, objects.', () => {
		;[...new Screener(mock).generate()].forEach((token) => {
			assert.ok(token instanceof Token)
			assert.ok(!(token instanceof TokenWhitespace))
		})
	})

	test('Screener computes filebound token values.', () => {
		const tokens: Token[] = [...new Screener(mock).generate()]
		assert.strictEqual(tokens[0].cook(), true)
		assert.strictEqual(lastItem(tokens).cook(), false)
	})
})



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
