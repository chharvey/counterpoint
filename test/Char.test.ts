import * as assert from 'assert'

import Scanner  from '../src/class/Scanner.class'
import Char, {
	EOT,
} from '../src/class/Char.class'

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
`



describe('Char', () => {
	describe('#source, #line, #column', () => {
		it('works.', () => {
			const {source, line_index, col_index} = new Char(new Scanner(mock), 22)
			assert.deepStrictEqual([source, line_index + 1, col_index + 1], ['3', 4, 9])
		})
	})

	describe('#lookahead', () => {
		it('is Char.', () => {
			const lookahead: Char|null = new Char(new Scanner(mock), 24).lookahead()
			assert.ok(lookahead instanceof Char)
			const {source, line_index, col_index} = lookahead !
			assert.deepStrictEqual([source, line_index + 1, col_index + 1], ['*', 4, 12])
		})
		it('if last is null.', () => {
			const scanner: Scanner = new Scanner(mock)
			const char: Char = new Char(scanner, lastIndex(scanner.source_text))
			assert.strictEqual(char.source, EOT)
			assert.strictEqual(char.lookahead(), null)
		})
	})
})
