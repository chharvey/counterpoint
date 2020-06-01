import * as assert from 'assert'

import {CONFIG_DEFAULT} from '../'
import Screener from '../src/class/Screener.class'
import Token, {
	TokenWhitespace,
} from '../src/class/Token.class'

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



describe('Screener.', () => {
	describe('#generate', () => {
		it('yields `Token`, non-`TokenWhitespace`, objects.', () => {
			;[...new Screener(mock, CONFIG_DEFAULT).generate()].forEach((token) => {
				assert.ok(token instanceof Token)
				assert.ok(!(token instanceof TokenWhitespace))
			})
		})
	})
})
