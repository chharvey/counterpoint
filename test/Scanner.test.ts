import * as assert from 'assert'

import Scanner  from '../src/class/Scanner.class'
import Char, {
	STX,
	ETX,
} from '../src/class/Char.class'

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
`



describe('Scanner', () => {
	describe('.constructor', () => {
		it('wraps source text.', () => {
			const scanner: Scanner = new Scanner(mock)
			assert.strictEqual(scanner.source_text[0], STX)
			assert.strictEqual(scanner.source_text[1], '\n')
			assert.strictEqual(scanner.source_text[3], '5')
			assert.strictEqual(lastItem(scanner.source_text), ETX)
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

	describe('#generate', () => {
		it('yields Character objects.', () => {
			const scanner: Scanner = new Scanner(mock)
			;[...scanner.generate()].forEach((char) => {
				assert.ok(char instanceof Char)
			})
		})
	})
})
