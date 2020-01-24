const {ETX} = require('../build/class/Scanner.class.js')
const {TokenNumber} = require('../build/class/Token.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')

const mock = `
5 + 03 *  -2

600  /  (  *  23

4 * 2 ^ /

-60 * -2 / 12
`.trim()



test('Screener computes filebound token values.', () => {
	const screener = new Screener(mock)
	const generator = screener.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value.value).toBe(true)
	while (iterator_result.value.source !== ETX) {
		iterator_result = generator.next()
	}
	expect(iterator_result.value.value).toBe(false)
	iterator_result = generator.next()
	expect(iterator_result.done).toBe(true)
})



test('Screener computes number token values.', () => {
	const screener = new Screener(mock)
	const generator = screener.generate()
	let iterator_result = generator.next()
	while (!iterator_result.done) {
		const token = iterator_result.value
		if (token instanceof TokenNumber) {
			expect(token.value).toBe(parseInt(token.source))
		}
		iterator_result = generator.next()
	}
})
