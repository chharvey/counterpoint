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



test('Screener computes `TokenString` values.', () => {
	const tokens = [...new Screener(`
5 + 03 + '' * 'hello' *  -2;

'0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6';

'0 \\u{24} 1 \\u{005f} 2 \\u{} 3';

'012\\
345
678';
	`.trim()).generate()]
	expect(tokens[ 5].cook()).toBe(``)
	expect(tokens[ 7].cook()).toBe(`hello`)
	expect(tokens[11].cook()).toBe(`0 \' 1 \\ 2 \u0020 3 \t 4 \n 5 \r 6`)
	expect(tokens[13].cook()).toBe(`0 $ 1 _ 2 \0 3`)
	expect(tokens[15].cook()).toBe(`012 345\n678`)
})



test('Screener computes `TokenTemplate` values.', () => {
	const tokens = [...new Screener(`
600  /  \`\` * 3 + \`hello\` *  2;

3 + \`head{{ * 2
3 + }}midl{{ * 2
3 + }}tail\` * 2

\`0 \\\` 1\`;

\`0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7\`;

\`0 \\u{24} 1 \\u{005f} 2 \\u{} 3\`;

\`012\\
345
678\`;
	`.trim()).generate()]
	expect(tokens[ 3].cook()).toBe(``)
	expect(tokens[ 7].cook()).toBe(`hello`)
	expect(tokens[13].cook()).toBe(`head`)
	expect(tokens[18].cook()).toBe(`midl`)
	expect(tokens[23].cook()).toBe(`tail`)
	expect(tokens[26].cook()).toBe(`0 \` 1`)
	expect(tokens[28].cook()).toBe(`0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\` 7`)
	expect(tokens[30].cook()).toBe(`0 \\u{24} 1 \\u{005f} 2 \\u{} 3`)
	expect(tokens[32].cook()).toBe(`012\\\n345\n678`)
})



test('UTF-16 encoding throws when input is out of range.', () => {
	const stringtoken = [...new Screener(`
'a string literal with a unicode \\u{a00061} escape sequence out of range';
	`.trim()).generate()][1]
	expect(() => stringtoken.cook()).toThrow(RangeError)
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
