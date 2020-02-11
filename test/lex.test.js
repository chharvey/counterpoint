const {default: Scanner} = require('../build/class/Scanner.class.js')
const {default: Lexer} = require('../build/class/Lexer.class.js')
const {
	default: Char,
	STX,
	ETX,
} = require('../build/class/Char.class.js')
const {
	default: Token,
	TokenFilebound,
	TokenWhitespace,
	TokenCommentLine,
	TokenCommentMulti,
	TokenCommentMultiNest,
	TokenNumber,
	TokenPunctuator,
} = require('../build/class/Token.class.js')
const {
	LexError01,
	LexError02,
	LexError03,
} = require('../build/error/LexError.class.js')

const mock = `
3 - 50 + * 2

5 + 03 *  -2

600  /  3  *  2

600  /  (3  *  2

4 * 2 ^ 3
`.trim()



test('Lexer recognizes `TokenFilebound` conditions.', () => {
	const lexer = new Lexer(mock)
	const generator = lexer.generate()
	let iterator_result = generator.next()
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
	expect(iterator_result.value.source).toBe(STX)
	while (iterator_result.value.source !== ETX) {
		iterator_result = generator.next()
	}
	expect(iterator_result.value).toBeInstanceOf(TokenFilebound)
	expect(iterator_result.value.source).toBe(ETX)
	iterator_result = generator.next()
	expect(iterator_result.done).toBe(true)
})



test('Lexer recognizes `TokenWhitespace` conditions.', () => {
	;[...new Lexer(TokenWhitespace.CHARS.join('')).generate()].slice(1, -1).forEach((value) => {
		expect(value).toBeInstanceOf(TokenWhitespace)
	})
})



describe('Lexer recognizes `TokenCommentLine` conditions.', () => {
	test('Basic line comment.', () => {
		expect([...new Lexer(`
500  +  30; ;  \\ line comment  *  2
8;
		`.trim()).generate()][11]).toBeInstanceOf(TokenCommentLine)
	})

	test('Empty line comment.', () => {
		const comment = [...new Lexer(`
\\
8;
		`.trim()).generate()][2]
		expect(comment).toBeInstanceOf(TokenCommentLine)
		expect(comment.source).toBe('\\')
	})

	test('Line comment starting character.', () => {
		;[...new Lexer(`
\\a \\ line comment starting with "a"
\\c \\ line comment starting with "c"
\\e \\ line comment starting with "e"
\\f \\ line comment starting with "f"
\\g \\ line comment starting with "g"
\\h \\ line comment starting with "h"
\\i \\ line comment starting with "i"
\\j \\ line comment starting with "j"
\\k \\ line comment starting with "k"
\\l \\ line comment starting with "l"
\\m \\ line comment starting with "m"
\\n \\ line comment starting with "n"
\\p \\ line comment starting with "p"
\\r \\ line comment starting with "r"
\\s \\ line comment starting with "s"
\\t \\ line comment starting with "t"
\\u \\ line comment starting with "u"
\\v \\ line comment starting with "v"
\\w \\ line comment starting with "w"
\\y \\ line comment starting with "y"
8;
		`.trim()).generate()].slice(2, -3).filter((comment) => !(comment instanceof TokenWhitespace)).forEach((comment) => {
			expect(comment).toBeInstanceOf(TokenCommentLine)
		})
	})

	test('Line comment non-starting character.', () => {
		`
\\b \\ line comment starting with "b" (fail)
\\d \\ line comment starting with "d" (fail)
\\o \\ line comment starting with "o" (fail)
\\q \\ line comment starting with "q" (fail)
\\x \\ line comment starting with "x" (fail)
\\z \\ line comment starting with "z" (fail)
		`.trim().split('\n').map((source) => new Lexer(`${source}\n`)).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError03)
		})
	})

	test('Unfinished line comment throws.', () => {
		;[`
\\ line comment
		`, `
\\ line \u0003 comment
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})
})



describe('Lexer recognizes `TokenCommentMulti` conditions.', () => {
	test('Basic multiline comment.', () => {
		expect([...new Lexer(`
500  +  "multiline
comment" 30; ;
		`.trim()).generate()][6]).toBeInstanceOf(TokenCommentMulti)
	})

	test('Empty multiline comment.', () => {
		const tokens = [...new Lexer(`
""
" "
		`.trim()).generate()]
		expect(tokens[2]).toBeInstanceOf(TokenCommentMulti)
		expect(tokens[4]).toBeInstanceOf(TokenCommentMulti)
		expect(tokens[2].source).toBe('""')
		expect(tokens[4].source).toBe('" "')
	})

	test('Multiline comment containing string delimiters.', () => {
		const tokens = [...new Lexer(`
"Here is a multiline
comment 'that contains' a string."
"Here is a multiline comment
that contains 'a string start marker but no end."
		`.trim()).generate()]
		expect(tokens[2]).toBeInstanceOf(TokenCommentMulti)
		expect(tokens[4]).toBeInstanceOf(TokenCommentMulti)
		expect(tokens[5]).toBeInstanceOf(TokenFilebound)
		expect(tokens[5].cook()).toBe(false)
	})

	test('Unfinished multiline comment throws.', () => {
		;[`
"multiline
comment
		`, `
"multiline
\u0003
comment"
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})
})



describe('Lexer recognizes `TokenCommentMultiNest` conditions.', () => {
	test('Empty nestable multiline comment.', () => {
		const tokens = [...new Lexer(`
"{}"
"{ }"
		`.trim()).generate()]
		expect(tokens[2]).toBeInstanceOf(TokenCommentMultiNest)
		expect(tokens[4]).toBeInstanceOf(TokenCommentMultiNest)
		expect(tokens[2].source).toBe('"{}"')
		expect(tokens[4].source).toBe('"{ }"')
	})

	test('Nestable multiline comment containing multiline comment.', () => {
		const comment = [...new Lexer(`
"{multiline
that has a "nested" multiline
comment}"
		`.trim()).generate()][2]
		expect(comment).toBeInstanceOf(TokenCommentMultiNest)
	})

	test('Nestable multiline comment containing nestable multiline comment.', () => {
		const comment = [...new Lexer(`
"{multiline
that has a "{nestable nested}" multiline
comment}"
		`.trim()).generate()][2]
		expect(comment).toBeInstanceOf(TokenCommentMultiNest)
	})

	test('Nestable comment containing interpolation delimiters.', () => {
		const tokens = [...new Lexer(`
"{A nestable "{co"{mm}"ent}" with \`the {{interpolation}} syntax\`.}"
		`.trim()).generate()]
		expect(tokens[2]).toBeInstanceOf(TokenCommentMultiNest)
		expect(tokens[3]).toBeInstanceOf(TokenFilebound)
		expect(tokens[3].cook()).toBe(false)
	})

	test('Unfinished nestable multiline comment throws.', () => {
		;[`
"{multiline
comment
		`, `
"{multiline
"{comm}"ent
		`, `
"{multiline
\u0003
"{comm}"ent}"
		`, `
"{multiline
"{co\u0003mm}"ent}"
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})
})



test('Lexer recognizes `TokenString` conditions.', () => {
})



test('Lexer recognizes `TokenNumber` conditions.', () => {
	const bank = TokenNumber.DIGITS.get(10)
	const lexer = new Lexer(bank.join(' '))
	const generator = lexer.generate()
	;[...generator].slice(1, -1).forEach((value) => {
		try {
			expect(value).toBeInstanceOf(TokenNumber)
		} catch {
			expect(value).toBeInstanceOf(TokenWhitespace)
		}
	})
})



test('Lexer recognizes `TokenWord` conditions.', () => {
})



test('Lexer recognizes `TokenPunctuator` conditions.', () => {
	const bank = [
		...TokenPunctuator.CHARS_1,
		...TokenPunctuator.CHARS_2,
		...TokenPunctuator.CHARS_3,
	].filter((p) => p !== '')
	const lexer = new Lexer(bank.join(' '))
	const generator = lexer.generate()
	;[...generator].slice(1, -1).forEach((value) => {
		try {
			expect(value).toBeInstanceOf(TokenPunctuator)
		} catch {
			expect(value).toBeInstanceOf(TokenWhitespace)
		}
	})
})



test('Lexer rejects unrecognized characters.', () => {
	`. ~ , [ ] | & ! { } : # $ %`.split(' ').forEach((c) => {
		const lexer = new Lexer(`
5  +  30
+ 6 ^ - (${c} - 37 *
		`.trim())
		const generator = lexer.generate()
		let iterator_result = generator.next()
		expect(() => {
			while (!iterator_result.done) {
				iterator_result = generator.next()
			}
		}).toThrow(LexError01)
	})
})



test('TokenNumber#serialize', () => {
	const lexer = new Lexer(`5`)
	lexer.advance(2) // bypass added `\u0002\u000a`
	const token = new TokenNumber(lexer)
	token.add(...'42'.split('').map((s) => new Char(new Scanner(s), 2)))
	expect(token.source).toBe('542')
	expect(token.serialize()).toBe('<NUMBER line="1" col="1" value="542">542</NUMBER>')
})



test('TokenPunctuator#serialize', () => {
	const lexer = new Lexer(`+`)
	lexer.advance(2) // bypass added `\u0002\u000a`
	const token = new TokenPunctuator(lexer)
	token.add(new Char(new Scanner('='), 2))
	expect(token.source).toBe('+=')
	expect(token.serialize()).toBe('<PUNCTUATOR line="1" col="1" value="+=">+=</PUNCTUATOR>')
})
