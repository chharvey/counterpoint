import * as assert from 'assert'

import {CONFIG_DEFAULT} from '../../src/SolidConfig'
import {
	Scanner,
	Token,
	TokenWhitespace,
} from '../../src/lexer/'

const mock: string = `
5  +  30 \u000d

6 ^ 2 - 37 *

( 4 * \u000d9 ^ 3

3 - 50 + * 2

5 + 03 +  *  -2

600  /  3  *  2

600  /  (3  *  2

4 * 2 ^ 3
`



describe('Screener.', () => {
	describe('#generate', () => {
		it('yields `Token`, non-`TokenWhitespace`, objects.', () => {
			;[...new Scanner(mock, CONFIG_DEFAULT).lexer.screener.generate()].forEach((token) => {
				assert.ok(token instanceof Token)
				assert.ok(!(token instanceof TokenWhitespace))
			})
		})
	})
})
