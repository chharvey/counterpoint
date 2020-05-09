import * as assert from 'assert'

import Util     from '../src/class/Util.class'
import Parser   from '../src/class/Parser.class'



suite('Empty file.', () => {
	test('Compile empty file.', () => {
		assert.strictEqual(new Parser('').parse().decorate().compile(), Util.dedent(`
			export default null
		`))
	})
})
