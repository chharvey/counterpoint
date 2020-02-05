const {default: Screener} = require('../build/class/Screener.class.js')
const {ETX} = require('../build/class/Char.class.js')
const {
	default: Token,
	TokenWhitespace,
	TokenNumber,
} = require('../build/class/Token.class.js')

const mock = `
5 + 03 *  -2

600  /  (  *  23

4 * 2 ^ /

-60 * -2 / 12
`.trim()



test('Screener yields `Token`, non-`TokenWhitespace`, objects.', () => {
	const screener = new Screener(mock)
	const generator = screener.generate()
	let iterator_result = generator.next()
	while (!iterator_result.done) {
		const token = iterator_result.value
		expect(token).toBeInstanceOf(Token)
		expect(token).not.toBeInstanceOf(TokenWhitespace)
		iterator_result = generator.next()
	}
})



test('Screener computes filebound token values.', () => {
	const screener = new Screener(mock)
	const generator = screener.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value.cook()).toBe(true)
	while (iterator_result.value.source !== ETX) {
		iterator_result = generator.next()
	}
	expect(iterator_result.value.cook()).toBe(false)
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
			expect(token.cook()).toBe(parseInt(token.source))
		}
		iterator_result = generator.next()
	}
})
