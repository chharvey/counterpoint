const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')
const {
	TokenWhitespace,
	TokenWord,
	TokenWordBasic,
	TokenWordUnicode,
} = require('../build/class/Token.class.js')
const {
	LexError02,
} = require('../build/error/LexError.class.js')



describe('Lexer recognizes `TokenWordBasic` conditions.', () => {
	const CHAR_START = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z _'.split(' ')
	const CHAR_REST = CHAR_START.concat('0 1 2 3 4 5 6 7 8 9'.split(' '))
	test('Word beginners.', () => {
		;[...new Lexer(CHAR_START.join(' ')).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
			expect(token).toBeInstanceOf(TokenWord)
		})
	})

	test('Word continuations.', () => {
		const tokens = [...new Screener(`
this is a word
_words _can _start _with _underscores
_and0 _can1 contain2 numb3rs
		`.trim()).generate()].slice(1, -1)
		tokens.forEach((token) => {
			expect(token).toBeInstanceOf(TokenWordBasic)
		})
		expect(tokens.length).toBe(13)
	})

	test('Words cannot start with a digit.', () => {
		const tokens = [...new Screener(`
this is 0a word
_words 1c_an _start 2w_ith _underscores
_and0 3c_an1 contain2 44numb3rs
		`.trim()).generate()].slice(1, -1)
		expect(tokens.filter((token) => token instanceof TokenWord).map((token) => token.source).join(' ')).toBe(`
this is a word _words c_an _start w_ith _underscores _and0 c_an1 contain2 numb3rs
		`.trim())
	})
})



describe('Screener assigns word values for basic words.', () => {
	test('TokenWordBasic#serialize for keywords.', () => {
		expect([...new Screener(`
let unfixed
		`.trim()).generate()].filter((token) => token instanceof TokenWord).map((token) => token.serialize()).join('\n')).toBe(`
<WORD line="1" col="1" value="0">let</WORD>
<WORD line="1" col="5" value="1">unfixed</WORD>
		`.trim())
	})

	test('TokenWordBasic#serialize for identifiers.', () => {
		expect([...new Screener(`
this is a word
_words _can _start _with _underscores
_and0 _can1 contain2 numb3rs

a word _can repeat _with the same id
		`.trim()).generate()].filter((token) => token instanceof TokenWord).map((token) => token.serialize()).join('\n')).toBe(`
<WORD line="1" col="1" value="128">this</WORD>
<WORD line="1" col="6" value="129">is</WORD>
<WORD line="1" col="9" value="130">a</WORD>
<WORD line="1" col="11" value="131">word</WORD>
<WORD line="2" col="1" value="132">_words</WORD>
<WORD line="2" col="8" value="133">_can</WORD>
<WORD line="2" col="13" value="134">_start</WORD>
<WORD line="2" col="20" value="135">_with</WORD>
<WORD line="2" col="26" value="136">_underscores</WORD>
<WORD line="3" col="1" value="137">_and0</WORD>
<WORD line="3" col="7" value="138">_can1</WORD>
<WORD line="3" col="13" value="139">contain2</WORD>
<WORD line="3" col="22" value="140">numb3rs</WORD>
<WORD line="5" col="1" value="130">a</WORD>
<WORD line="5" col="3" value="131">word</WORD>
<WORD line="5" col="8" value="133">_can</WORD>
<WORD line="5" col="13" value="141">repeat</WORD>
<WORD line="5" col="20" value="135">_with</WORD>
<WORD line="5" col="26" value="142">the</WORD>
<WORD line="5" col="30" value="143">same</WORD>
<WORD line="5" col="35" value="144">id</WORD>
		`.trim())
	})
})



describe('Lexer recognizes `TokenWordUnicode` conditions.', () => {
	test('Word boundaries.', () => {
		const tokens = [...new Screener(`
\`this\` \`is\` \`a\` \`unicode word\`
\`any\` \`unicode word\` \`can\` \`contain\` \`any\` \`character\`
\`except\` \`back-ticks\` \`.\`
\`<hello world>\` \`Æther\` \`5 × 3\` \`\\u{24}hello\` \`\`
		`.trim()).generate()].slice(1, -1)
		expect(tokens.length).toBe(18)
		tokens.forEach((token) => {
			expect(token).toBeInstanceOf(TokenWordUnicode)
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
	test('TokenWordUnicode#serialize', () => {
		expect([...new Screener(`
\`this\` \`is\` \`a\` \`unicode word\`
\`any\` \`unicode word\` \`can\` \`contain\` \`any\` \`character\`
\`except\` \`back-ticks\` \`.\`
		`.trim()).generate()].filter((token) => token instanceof TokenWord).map((token) => token.serialize()).join('\n')).toBe(`
<WORD line="1" col="1" value="128">\`this\`</WORD>
<WORD line="1" col="8" value="129">\`is\`</WORD>
<WORD line="1" col="13" value="130">\`a\`</WORD>
<WORD line="1" col="17" value="131">\`unicode word\`</WORD>
<WORD line="2" col="1" value="132">\`any\`</WORD>
<WORD line="2" col="7" value="131">\`unicode word\`</WORD>
<WORD line="2" col="22" value="133">\`can\`</WORD>
<WORD line="2" col="28" value="134">\`contain\`</WORD>
<WORD line="2" col="38" value="132">\`any\`</WORD>
<WORD line="2" col="44" value="135">\`character\`</WORD>
<WORD line="3" col="1" value="136">\`except\`</WORD>
<WORD line="3" col="10" value="137">\`back-ticks\`</WORD>
<WORD line="3" col="23" value="138">\`.\`</WORD>
		`.trim())
	})
})
