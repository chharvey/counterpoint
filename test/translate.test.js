const {ETX} = require('../build/class/Scanner.class.js')
const {TokenNumber} = require('../build/class/Token.class.js')
const {default: Translator} = require('../build/class/Translator.class.js')

const mock = `
5 + 03 *  -2

600  /  (  *  23

4 * 2 ^ /

-60 * -2 / 12
`.trim()



test('Translator computes filebound token values.', () => {
	const translator = new Translator(mock)
	const generator = translator.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value.value).toBe(true)
	while (iterator_result.value.source !== ETX) {
		iterator_result = generator.next()
	}
	expect(iterator_result.value.value).toBe(false)
	iterator_result = generator.next()
	expect(iterator_result.done).toBe(true)
})



test('Translator computes number token values.', () => {
	const translator = new Translator(mock)
	const generator = translator.generate()
	let iterator_result = generator.next()
	while (!iterator_result.done) {
		const token = iterator_result.value
		if (token instanceof TokenNumber) {
			expect(token.value).toBe(parseInt(token.source))
		}
		iterator_result = generator.next()
	}
})
