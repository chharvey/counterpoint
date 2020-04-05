const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')
const {
	TokenWhitespace,
	TokenWord,
} = require('../build/class/Token.class.js')
const {
	LexError02,
} = require('../build/error/LexError.class.js')



describe('Lexer recognizes `TokenWord` conditions for non-unicode words.', () => {
	const CHAR_START = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z _'.split(' ')
	const CHAR_REST = CHAR_START.concat('0 1 2 3 4 5 6 7 8 9'.split(' '))
	test('Word beginners.', () => {
		;[...new Lexer(CHAR_START.join(' ')).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
			expect(token).toBeInstanceOf(TokenWord)
		})
	})

	test('Word continuations.', () => {
		const tokens = [...new Lexer(`
this is a word
_words _can _start _with _underscores
_and0 _can1 contain2 numb3rs
		`.trim()).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace))
		tokens.forEach((token) => {
			expect(token).toBeInstanceOf(TokenWord)
		})
		expect(tokens.length).toBe(13)
	})

	test('Words cannot start with a digit.', () => {
		const tokens = [...new Lexer(`
this is 0a word
_words 1c_an _start 2w_ith _underscores
_and0 3c_an1 contain2 44numb3rs
		`.trim()).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace))
		expect(tokens.filter((token) => token instanceof TokenWord).map((token) => token.source).join(' ')).toBe(`
this is a word _words c_an _start w_ith _underscores _and0 c_an1 contain2 numb3rs
		`.trim())
	})
})



describe('Screener assigns word values for non-unicode words.', () => {
	const printToken = (token) => `${token.cook()}: ${token.source}`
	test('Keyword word value is itself.', () => {
		expect([...new Screener(`let unfixed`).generate()].filter((token) => token instanceof TokenWord).map(printToken).join('\n')).toBe(`
let: let
unfixed: unfixed
		`.trim())
	})

	test('Identifier word value is unique number.', () => {
		expect([...new Screener(`
this is a word
_words _can _start _with _underscores
_and0 _can1 contain2 numb3rs

a word _can repeat _with the same id
		`.trim()).generate()].filter((token) => token instanceof TokenWord).map(printToken).join('\n')).toBe(`
0: this
1: is
2: a
3: word
4: _words
5: _can
6: _start
7: _with
8: _underscores
9: _and0
10: _can1
11: contain2
12: numb3rs
2: a
3: word
5: _can
13: repeat
7: _with
14: the
15: same
16: id
		`.trim())
	})
})



describe('Lexer recognizes `TokenWord` conditions for unicode words.', () => {
	test('Word boundaries.', () => {
		const tokens = [...new Screener(`
\`this\` \`is\` \`a\` \`unicode word\`
\`any\` \`unicode word\` \`can\` \`contain\` \`any\` \`character\`
\`except\` \`back-ticks\` \`.\`
\`<hello world>\` \`Æther\` \`5 × 3\` \`\\u{24}hello\` \`\`
		`.trim()).generate()].slice(1, -1)
		expect(tokens.length).toBe(18)
		tokens.forEach((token) => {
			expect(token).toBeInstanceOf(TokenWord)
		})
	})

	test('Unicode words cannot contain U+0060 GRAVE ACCENT.', () => {
		expect(() => [...new Screener(`
\`a \\\` grave accent\`
		`.trim()).generate()]).toThrow(LexError02)
	})

	test('Unicode words cannot contain U+0003 END OF TEXT.', () => {
		expect(() => [...new Screener(`
\`an \u0003 end of text.\`
		`.trim()).generate()]).toThrow(LexError02)
	})
})



describe('Screener assigns word values for unicode words.', () => {
	const printToken = (token) => `${token.cook()}: ${token.source}`
	test('Identifier word value is unique number.', () => {
		expect([...new Screener(`
\`this\` \`is\` \`a\` \`unicode word\`
\`any\` \`unicode word\` \`can\` \`contain\` \`any\` \`character\`
\`except\` \`back-ticks\` \`.\`
		`.trim()).generate()].filter((token) => token instanceof TokenWord).map(printToken).join('\n')).toBe(`
0: \`this\`
1: \`is\`
2: \`a\`
3: \`unicode word\`
4: \`any\`
3: \`unicode word\`
5: \`can\`
6: \`contain\`
4: \`any\`
7: \`character\`
8: \`except\`
9: \`back-ticks\`
10: \`.\`
		`.trim())
	})
})
