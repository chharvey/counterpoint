import * as assert from 'assert'

import {
	ScannerSolid as Scanner,
	Char,
} from '../../src/lexer/'

const lastItem  = (iter: any): any     => iter[lastIndex(iter)]
const lastIndex = (iter: any): number  => iter.length - 1

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



describe('Scanner', () => {
	describe('.constructor', () => {
		it('wraps source text.', () => {
			const scanner: Scanner = new Scanner(mock)
			assert.strictEqual(scanner.source_text[0], '\u0002')
			assert.strictEqual(scanner.source_text[1], '\n')
			assert.strictEqual(scanner.source_text[3], '5')
			assert.strictEqual(scanner.source_text[scanner.source_text.length - 2], '\n')
			assert.strictEqual(lastItem(scanner.source_text), '\u0003')
		})
		it('normalizes line endings.', () => {
			const scanner: Scanner = new Scanner(mock)
			assert.strictEqual(scanner.source_text[12], '\n')
			assert.strictEqual(scanner.source_text[13], '\n')
			assert.strictEqual(scanner.source_text[14], '6')
			assert.strictEqual(scanner.source_text[34], '\n')
			assert.strictEqual(scanner.source_text[35], '9')
		})
	})

	describe('ScannerSolid', () => {
		describe('#generate', () => {
			it('yields Character objects.', () => {
				const scanner: Scanner = new Scanner(mock)
				;[...scanner.generate()].forEach((char) => {
					assert.ok(char instanceof Char)
				})
			})
		})
	})
})
