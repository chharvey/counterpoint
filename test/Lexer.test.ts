import * as assert from 'assert'

import Util  from '../src/class/Util.class'
import Lexer from '../src/class/Lexer.class'
import Token, {
	TemplatePosition,
	TokenFilebound,
	TokenWhitespace,
	TokenPunctuator,
	TokenNumber,
	TokenKeyword,
	TokenIdentifierBasic,
	TokenIdentifierUnicode,
	TokenString,
	TokenTemplate,
	TokenCommentLine,
	TokenCommentMulti,
	TokenCommentBlock,
} from '../src/class/Token.class'

import {
	LexError01,
	LexError02,
	LexError03,
	LexError04,
} from '../src/error/LexError.class'

const lastItem  = (iter: any): any     => iter[lastIndex(iter)]
const lastIndex = (iter: any): number  => iter.length-1

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



describe('Lexer', () => {
	describe('#generate', () => {
		it('recognizes `TokenFilebound` conditions.', () => {
			const tokens: Token[] = [...new Lexer(mock).generate()]
			assert.ok(tokens[0] instanceof TokenFilebound)
			assert.strictEqual(tokens[0].source, '\u0002')
			assert.ok(lastItem(tokens) instanceof TokenFilebound)
			assert.strictEqual(lastItem(tokens).source, '\u0003')
		})
		it('recognizes `TokenWhitespace` conditions.', () => {
			;[...new Lexer(TokenWhitespace.CHARS.join('')).generate()].slice(1, -1).forEach((value) => {
				assert.ok(value instanceof TokenWhitespace)
			})
		})
		it('rejects unrecognized characters.', () => {
			`. ~ , [ ] | & ! { } : # $ "`.split(' ').map((c) => new Lexer(`
				5  +  30
				+ 6 ^ - (${c} - 37 *
			`)).forEach((lexer) => {
				assert.throws(() => [...lexer.generate()], LexError01)
			})
		})

		context('unfinished tokens.', () => {
			;[...new Map<string, string[]>([
				['line comment', [`
					% line \u0003 comment containing EOT
					8;
				`]],
				['multiline comment', [`
					{%unfinished multiline
					comment
				`, `
					{%unfinished multiline
					{%comm%}ent
				`, `
					{%unfinished multiline
					\u0003
					{%comm%}ent%}
				`, `
					{%unfinished multiline
					{%co\u0003mm%}ent%}
				`]],
				['block comment', [`
					%%%
					block comment without end delimiters
				`, `
					%%%
					block comment containing \u0003 character
					%%%
					8;
				`]],
				['string', [`
					'string without end delimiter
				`, `
					'string with end delimiter but contains \u0003 character'
					8;
				`]],
				['template', [`
					'''template without end delimiter
				`, `
					'''template with end delimiter but contains \u0003 character'''
					8;
				`]],
				['misc.', [`
					'''template-full that ends with a single apostrophe ''''
				`, `
					}}template-tail that ends with a single apostrophe ''''
				`]],
			])].forEach(([name, sources]) => {
				it(`throws when ${name} token is unfinished.`, () => {
					sources.map((source) => new Lexer(source)).forEach((lexer) => {
						assert.throws(() => [...lexer.generate()], LexError02)
					})
				})
			})
		})

		context('recognizes `TokenCommentLine` conditions.', () => {
			specify('Empty line comment.', () => {
				const comment: Token = [...new Lexer(`
					%
					8;
				`).generate()][2]
				assert.ok(comment instanceof TokenCommentLine)
				assert.strictEqual(comment.source, '%\n')
			})
			specify('Basic line comment.', () => {
				assert.ok([...new Lexer(`
					500  +  30; ;  % line comment  *  2
					8;
				`).generate()][11] instanceof TokenCommentLine)
			})
			specify('Line comment at end of file not followed by LF.', () => {
				assert.doesNotThrow(() => [...new Lexer(`
					% line comment not followed by LF
				`.trimEnd()).generate()])
			})
		})

		context('recognizes `TokenCommentMulti` conditions.', () => {
			specify('Empty multiline comment.', () => {
				const tokens: Token[] = [...new Lexer(`
					{%%}
					{% %}
				`).generate()]
				assert.ok(tokens[2] instanceof TokenCommentMulti)
				assert.ok(tokens[4] instanceof TokenCommentMulti)
				assert.strictEqual(tokens[2].source, '{%%}')
				assert.strictEqual(tokens[4].source, '{% %}')
			})
			specify('Nonempty multiline comment.', () => {
				const comment: Token = [...new Lexer(`
					{% multiline
					that has contents
					comment %}
				`).generate()][2]
				assert.ok(comment instanceof TokenCommentMulti)
			})
			specify('Multiline comment containing nested multiline comment.', () => {
				const tokens: Token[] = [...new Lexer(`
					{% multiline
					that has a {% nestable nested %} multiline
					comment %}
				`).generate()]
				assert.strictEqual(tokens.length, 5)
				assert.ok(tokens[2] instanceof TokenCommentMulti)
			})
			specify('Multiline comment containing interpolation delimiters.', () => {
				const tokens: Token[] = [...new Lexer(`
					{% A nestable {% co{%mm%}ent %} with '''the {{interpolation}} syntax'''. %}
				`).generate()]
				assert.ok(tokens[2] instanceof TokenCommentMulti)
				assert.ok(tokens[4] instanceof TokenFilebound)
			})
		})

		context('recognizes `TokenCommentBlock` conditions.', () => {
			specify('Empty block comment.', () => {
				const tokens: Token[] = [...new Lexer(Util.dedent(`
					%%%
					%%%
					8;
				`)).generate()]
				assert.ok(tokens[2] instanceof TokenCommentBlock)
				assert.strictEqual(tokens[2].source, Util.dedent(`
					%%%
					%%%
				`).trim())
				assert.strictEqual(tokens[4].source, '8')
			})
			specify('Basic block comment.', () => {
				const tokens: Token[] = [...new Lexer(`
					%%%
					abcde
					5 + 3
					%%%

						%%%
						abcde
						5 + 3
						%%%
					8;
				`).generate()]
				assert.ok(tokens[2] instanceof TokenCommentBlock)
				assert.ok(tokens[4] instanceof TokenCommentBlock)
				assert.strictEqual(tokens[6].source, '8')
			})
			specify('Block comment at end of file end delimiter not followed by LF.', () => {
				assert.doesNotThrow(() => [...new Lexer(`
					%%%
					block comment with end delimiter, but not followed by LF
					%%%
				`.trimEnd()).generate()])
			})
			specify('Block comment delimiters must be on own line.', () => {
				const tokens: Token[] = [...new Lexer(`
					%%%
					these quotes do not end the doc comment%%%
					%%%nor do these
					%%%
					%%% 3 * 2
					5 + 3 %%%
					8;
				`).generate()]
				assert.ok(tokens[ 2] instanceof TokenCommentBlock)
				assert.ok(tokens[ 4] instanceof TokenCommentLine)
				assert.ok(tokens[12] instanceof TokenCommentLine)
				assert.strictEqual(tokens[14].source, '8')
			})
		})

		context('recognizes `TokenString` conditions.', () => {
			specify('Basic strings.', () => {
				const tokens: Token[] = [...new Lexer(`
					3 - 50 + * 2
					5 + 03 + '' * 'hello' *  -2
					600  /  3  *  2
					600  /  (3  *  2
					4 * 2 ^ 3
				`).generate()]
				assert.ok(tokens[22] instanceof TokenString)
				assert.strictEqual(tokens[22].source.length, 2)
				assert.ok(tokens[26] instanceof TokenString)
				assert.strictEqual(tokens[26].source, `'hello'`)
			})
			specify('Escaped characters.', () => {
				const tokenstring: Token = [...new Lexer(`
					'0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6';
				`).generate()][2]
				assert.strictEqual(tokenstring.source.slice( 3,  5), `\\'`)
				assert.strictEqual(tokenstring.source.slice( 8, 10), `\\\\`)
				assert.strictEqual(tokenstring.source.slice(13, 15), `\\s`)
				assert.strictEqual(tokenstring.source.slice(18, 20), `\\t`)
				assert.strictEqual(tokenstring.source.slice(23, 25), `\\n`)
				assert.strictEqual(tokenstring.source.slice(28, 30), `\\r`)
			})
			specify('Escaped character sequences.', () => {
				const tokenstring: Token = [...new Lexer(`
					'0 \\u{24} 1 \\u{005f} 2 \\u{} 3';
				`).generate()][2]
				assert.strictEqual(tokenstring.source.slice( 3,  9), `\\u{24}`)
				assert.strictEqual(tokenstring.source.slice(12, 20), `\\u{005f}`)
				assert.strictEqual(tokenstring.source.slice(23, 27), `\\u{}`)
			})
			specify('Line continuation.', () => {
				const tokenstring: Token = [...new Lexer(`
					'012\\
					345
					678';
				`).generate()][2]
				assert.strictEqual(tokenstring.source.slice( 4,  6), `\\\n`)
				assert.strictEqual(tokenstring.source.slice(14, 15), `\n`)
			})
			specify('Strings containing comment syntax.', () => {
				;[`
					'Here is a string % that contains a line comment start marker.'
				`, `
					'Here is a string {% that contains %} a multiline comment.'
				`, `
					'Here is a string {% that contains a comment start marker but no end.'
				`].map((source) => new Lexer(source)).forEach((lexer) => {
					assert.doesNotThrow(() => [...lexer.generate()])
				})
			})
			specify('Invalid escape sequences.', () => {
				;[`
					'a string literal with \\u{6g} an invalid escape sequence'
				`, `
					'a string literal with \\u{61 an invalid escape sequence'
				`].map((source) => new Lexer(source)).forEach((lexer) => {
					assert.throws(() => [...lexer.generate()], LexError03)
				})
			})
		})

		context('recognizes `TokenTemplate` conditions.', () => {
			specify('Basic templates.', () => {
				const tokens: Token[] = [...new Lexer(`
					600  /  '''''' * 3 + '''hello''' *  2
				`).generate()]
				assert.ok(tokens[ 6] instanceof TokenTemplate)
				assert.strictEqual((tokens[ 6] as TokenTemplate).position, TemplatePosition.FULL)
				assert.strictEqual(tokens[ 6].source.length, 6)
				assert.ok(tokens[14] instanceof TokenTemplate)
				assert.strictEqual((tokens[14] as TokenTemplate).position, TemplatePosition.FULL)
				assert.strictEqual(tokens[14].source, `'''hello'''`)
			})
			specify('Template interpolation.', () => {
				const tokens: Token[] = [...new Lexer(`
					3 + '''head{{ * 2
					3 + }}midl{{ * 2
					3 + }}tail''' * 2
				`).generate()]
				assert.ok(tokens[ 6] instanceof TokenTemplate)
				assert.strictEqual((tokens[ 6] as TokenTemplate).position, TemplatePosition.HEAD)
				assert.strictEqual(tokens[ 6].source, `'''head{{`)
				assert.ok(tokens[16] instanceof TokenTemplate)
				assert.strictEqual((tokens[16] as TokenTemplate).position, TemplatePosition.MIDDLE)
				assert.strictEqual(tokens[16].source, `}}midl{{`)
				assert.ok(tokens[26] instanceof TokenTemplate)
				assert.strictEqual((tokens[26] as TokenTemplate).position, TemplatePosition.TAIL)
				assert.strictEqual(tokens[26].source, `}}tail'''`)
			})
			specify('Empty/comment interpolation.', () => {
				const tokens: Token[] = [...new Lexer(`
					'''abc{{ }}def'''
					'''ghi{{}}jkl'''
					'''mno{{ {% pqr %} }}stu'''
				`).generate()]
				assert.ok(tokens[ 2] instanceof TokenTemplate)
				assert.strictEqual((tokens[ 2] as TokenTemplate).position, TemplatePosition.HEAD)
				assert.strictEqual(tokens[ 2].source, `'''abc{{`)
				assert.ok(tokens[ 4] instanceof TokenTemplate)
				assert.strictEqual((tokens[ 4] as TokenTemplate).position, TemplatePosition.TAIL)
				assert.strictEqual(tokens[ 4].source, `}}def'''`)
				assert.ok(tokens[ 6] instanceof TokenTemplate)
				assert.strictEqual((tokens[ 6] as TokenTemplate).position, TemplatePosition.HEAD)
				assert.strictEqual(tokens[ 6].source, `'''ghi{{`)
				assert.ok(tokens[ 7] instanceof TokenTemplate)
				assert.strictEqual((tokens[ 7] as TokenTemplate).position, TemplatePosition.TAIL)
				assert.strictEqual(tokens[ 7].source, `}}jkl'''`)
				assert.ok(tokens[ 9] instanceof TokenTemplate)
				assert.strictEqual((tokens[ 9] as TokenTemplate).position, TemplatePosition.HEAD)
				assert.strictEqual(tokens[ 9].source, `'''mno{{`)
				assert.ok(tokens[13] instanceof TokenTemplate)
				assert.strictEqual((tokens[13] as TokenTemplate).position, TemplatePosition.TAIL)
				assert.strictEqual(tokens[13].source, `}}stu'''`)
			})
			specify('Nested interpolation.', () => {
				const tokens: Token[] = [...new Lexer(`
					1 + '''head1 {{ 2 + '''head2 {{ 3 ^ 3 }} tail2''' * 2 }} tail1''' * 1
				`).generate()]
				assert.ok(tokens[ 6] instanceof TokenTemplate)
				assert.strictEqual((tokens[ 6] as TokenTemplate).position, TemplatePosition.HEAD)
				assert.strictEqual(tokens[ 6].source, `'''head1 {{`)
				assert.ok(tokens[12] instanceof TokenTemplate)
				assert.strictEqual((tokens[12] as TokenTemplate).position, TemplatePosition.HEAD)
				assert.strictEqual(tokens[12].source, `'''head2 {{`)
				assert.ok(tokens[20] instanceof TokenTemplate)
				assert.strictEqual((tokens[20] as TokenTemplate).position, TemplatePosition.TAIL)
				assert.strictEqual(tokens[20].source, `}} tail2'''`)
				assert.ok(tokens[26] instanceof TokenTemplate)
				assert.strictEqual((tokens[26] as TokenTemplate).position, TemplatePosition.TAIL)
				assert.strictEqual(tokens[26].source, `}} tail1'''`)
			})
			specify('Non-escaped characters.', () => {
				const tokentemplate: Token = [...new Lexer(`
					'''0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7''';
				`).generate()][2]
				assert.strictEqual(tokentemplate.source.slice( 5,  7), `\\'`)
				assert.strictEqual(tokentemplate.source.slice(10, 12), `\\\\`)
				assert.strictEqual(tokentemplate.source.slice(15, 17), `\\s`)
				assert.strictEqual(tokentemplate.source.slice(20, 22), `\\t`)
				assert.strictEqual(tokentemplate.source.slice(25, 27), `\\n`)
				assert.strictEqual(tokentemplate.source.slice(30, 32), `\\r`)
				assert.strictEqual(tokentemplate.source.slice(35, 38), `\\\\\``)
			})
			specify('Non-escaped character sequences.', () => {
				const tokentemplate: Token = [...new Lexer(`
					'''0 \\u{24} 1 \\u{005f} 2 \\u{} 3''';
				`).generate()][2]
				assert.strictEqual(tokentemplate.source.slice( 5, 11), `\\u{24}`)
				assert.strictEqual(tokentemplate.source.slice(14, 22), `\\u{005f}`)
				assert.strictEqual(tokentemplate.source.slice(25, 29), `\\u{}`)
			})
			specify('Line breaks.', () => {
				const tokentemplate: Token = [...new Lexer(`
					'''012\\
					345
					678''';
				`).generate()][2]
				assert.strictEqual(tokentemplate.source.slice( 6,  8), `\\\n`)
				assert.strictEqual(tokentemplate.source.slice(16, 17), `\n`)
			})
			specify('Invalid characters at end of template.', () => {
				;[`
					'''template-head that ends with a single open brace {{{
				`, `
					}}template-middle that ends with a single open brace {{{
				`].map((source) => new Lexer(source)).forEach((lexer) => {
					assert.throws(() => [...lexer.generate()], LexError01) // TODO change to parse error when `{` becomes punctuator
				})
			})
		})

		context('recognizes `TokenNumber` conditions.', () => {
			specify('implicit radix integers.', () => {
				;[...new Lexer(TokenNumber.DIGITS.get(TokenNumber.RADIX_DEFAULT) !.join(' ')).generate()]
					.slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
						assert.ok(token instanceof TokenNumber)
					})
				const tokens: Token[] = [...new Lexer(`
					+  55  -  33  2  007  700  +91  -27  +091  -0027
				`).generate()]
				assert.strictEqual(tokens[ 4].source, `55`)
				assert.strictEqual(tokens[ 8].source, `33`)
				assert.strictEqual(tokens[10].source, `2`)
				assert.strictEqual(tokens[12].source, `007`)
				assert.strictEqual(tokens[14].source, `700`)
				assert.strictEqual(tokens[16].source, `+91`)
				assert.strictEqual(tokens[18].source, `-27`)
				assert.strictEqual(tokens[20].source, `+091`)
				assert.strictEqual(tokens[22].source, `-0027`)
			})
			specify('explicit radix integers.', () => {
				;[...TokenNumber.BASES].map(([base, radix]) =>
					[...new Lexer(
						TokenNumber.DIGITS.get(radix) !.map((d) => `\\${base}${d}`).join(' ')
					).generate()].slice(1, -1)
				).flat().filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
					assert.ok(token instanceof TokenNumber)
				})
				const source: string = `
					\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
					\\q320  \\q032  +\\q1032  -\\q1032  +\\q03  -\\q03
					\\o370  \\o037  +\\o1037  -\\o1037  +\\o06  -\\o06
					\\d370  \\d037  +\\d9037  -\\d9037  +\\d06  -\\d06
					\\xe70  \\x0e7  +\\x90e7  -\\x90e7  +\\x06  -\\x06
					\\ze70  \\z0e7  +\\z90e7  -\\z90e7  +\\z06  -\\z06
				`.trim().replace(/\n\t+/g, '  ')
				;[...new Lexer(source).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token, i) => {
					assert.ok(token instanceof TokenNumber)
					assert.strictEqual(token.source, source.split('  ')[i])
				})
			})
			specify('implicit radix integers with separators.', () => {
				const source: string = `
					12_345  +12_345  -12_345  0123_4567  +0123_4567  -0123_4567  012_345_678  +012_345_678  -012_345_678
				`.trim().replace(/\n\t+/g, '  ')
				;[...new Lexer(source).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token, i) => {
					assert.ok(token instanceof TokenNumber)
					assert.strictEqual(token.source, source.split('  ')[i])
				})
			})
			specify('explicit radix integers with separators.', () => {
				const source: string = `
					\\b1_00  \\b0_01  +\\b1_000  -\\b1_000  +\\b0_1  -\\b0_1
					\\q3_20  \\q0_32  +\\q1_032  -\\q1_032  +\\q0_3  -\\q0_3
					\\o3_70  \\o0_37  +\\o1_037  -\\o1_037  +\\o0_6  -\\o0_6
					\\d3_70  \\d0_37  +\\d9_037  -\\d9_037  +\\d0_6  -\\d0_6
					\\xe_70  \\x0_e7  +\\x9_0e7  -\\x9_0e7  +\\x0_6  -\\x0_6
					\\ze_70  \\z0_e7  +\\z9_0e7  -\\z9_0e7  +\\z0_6  -\\z0_6
				`.trim().replace(/\n\t+/g, '  ')
				;[...new Lexer(source).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token, i) => {
					assert.ok(token instanceof TokenNumber)
					assert.strictEqual(token.source, source.split('  ')[i])
				})
			})
			specify('invalid sequence.', () => {
				assert.deepStrictEqual([...new Lexer(`
					\\d39c
				`).generate()].slice(2, -2).map((token) => token.source), ['\\d39', 'c'])
			})
			specify('invalid escape characters.', () => {
				`
					 \\a0  \\c0  \\e0  \\f0  \\g0  \\h0  \\i0  \\j0  \\k0  \\l0  \\m0  \\n0  \\p0  \\r0  \\s0  \\t0  \\u0  \\v0  \\w0  \\y0  \\
					+\\a0 +\\c0 +\\e0 +\\f0 +\\g0 +\\h0 +\\i0 +\\j0 +\\k0 +\\l0 +\\m0 +\\n0 +\\p0 +\\r0 +\\s0 +\\t0 +\\u0 +\\v0 +\\w0 +\\y0 +\\
					-\\a0 -\\c0 -\\e0 -\\f0 -\\g0 -\\h0 -\\i0 -\\j0 -\\k0 -\\l0 -\\m0 -\\n0 -\\p0 -\\r0 -\\s0 -\\t0 -\\u0 -\\v0 -\\w0 -\\y0 -\\
				`.trim().split(' ').filter((src) => src !== '').map((src) => new Lexer(src)).forEach((lexer) => {
					assert.throws(() => [...lexer.generate()], LexError03)
				})
			})
			specify('integers with invalid digits start a new token.', () => {
				assert.deepStrictEqual([...new Lexer(`
					\\b1_0040_0000  \\q123_142_3  \\o123_456_78
				`).generate()].filter((token) => token instanceof TokenNumber).map((token) => token.source), [
					'\\b1_00', '40_0000', '\\q123_1', '42_3', '\\o123_456_7', '8'
				])
			})
			specify('numeric separator cannot appear at end of token.', () => {
				assert.throws(() => [...new Lexer(`12_345_`).generate()], LexError04)
			})
			specify('numeric separators cannot appear consecutively.', () => {
				assert.throws(() => [...new Lexer(`12__345`).generate()], LexError04)
			})
			specify('numeric separator at beginning of token is not a number token.', () => {
				assert.ok(!([...new Lexer(`_12345`).generate()][2] instanceof TokenNumber))
			})
		})

		it('recognizes `TokenKeyword` conditions.', () => {
			;[...new Lexer(`
				let
				unfixed
			`).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
				assert.ok(token instanceof TokenKeyword)
			})
		})

		context('recognizes `TokenIdentifier` conditions.', () => {
			context('recognizes `TokenIdentifierBasic` conditions.', () => {
				specify('Basic identifier beginners.', () => {
					;[...new Lexer(`
						A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z _
					`).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
						assert.ok(token instanceof TokenIdentifierBasic)
					})
				})
				specify('Identifier continuations.', () => {
					let tokens: Token[] = [...new Lexer(`
						this is a word
						_words _can _start _with _underscores
						_and0 _can1 contain2 numb3rs
					`).generate()]
					tokens = tokens.slice(1, -1).filter((token) => !(token instanceof TokenWhitespace))
					tokens.forEach((token) => {
						assert.ok(token instanceof TokenIdentifierBasic)
					})
					assert.strictEqual(tokens.length, 13)
				})
				specify('Identifiers cannot start with a digit.', () => {
					assert.deepStrictEqual([...new Lexer(`
						this is 0a word
						_words 1c_an _start 2w_ith _underscores
						_and0 3c_an1 contain2 44numb3rs
					`).generate()].slice(1, -1).filter((token) => token instanceof TokenIdentifierBasic).map((token) => token.source), `
						this is a word _words c_an _start w_ith _underscores _and0 c_an1 contain2 numb3rs
					`.trim().split(' '))
				})
			})
			context('recognizes `TokenIdentifierUnicode` conditions.', () => {
				specify('Identifier boundaries.', () => {
					let tokens: Token[] = [...new Lexer(`
						\`this\` \`is\` \`a\` \`unicode word\`
						\`any\` \`unicode word\` \`can\` \`contain\` \`any\` \`character\`
						\`except\` \`back-ticks\` \`.\`
						\`<hello world>\` \`Æther\` \`5 × 3\` \`\\u{24}hello\` \`\`
					`).generate()]
					tokens = tokens.slice(1, -1).filter((token) => !(token instanceof TokenWhitespace))
					tokens.forEach((token) => {
						assert.ok(token instanceof TokenIdentifierUnicode)
					})
					assert.strictEqual(tokens.length, 18)
				})
				it('should throw if Unicode identifier contains U+0060 GRAVE ACCENT.', () => {
					assert.throws(() => [...new Lexer(`
						\`a \\\` grave accent\`
					`).generate()], LexError02)
				})
				it('should throw if Unicode identifier contains U+0003 END OF TEXT.', () => {
					assert.throws(() => [...new Lexer(`
						\`an \u0003 end of text.\`
					`).generate()], LexError02)
				})
			})
		})

		it('recognizes `TokenPunctuator` conditions.', () => {
			;[...new Lexer(TokenPunctuator.PUNCTUATORS.join(' ')).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((value) => {
				assert.ok(value instanceof TokenPunctuator)
			})
		})
	})
})
