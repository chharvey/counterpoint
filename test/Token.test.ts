import * as assert from 'assert'

import Util     from '../src/class/Util.class'
import Lexer    from '../src/class/Lexer.class'
import Screener from '../src/class/Screener.class'
import Token, {
	TokenPunctuator,
	TokenNumber,
	TokenKeyword,
	TokenIdentifier,
	TokenIdentifierUnicode,
} from '../src/class/Token.class'

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



describe('Token', () => {
	describe('#cook', () => {
		context('TokenFilebound', () => {
			it('produces a boolean value.', () => {
				const tokens: Token[] = [...new Screener(mock).generate()]
				assert.strictEqual(tokens[0]       .cook(), true )
				assert.strictEqual(lastItem(tokens).cook(), false)
			})
		})
		context('TokenString', () => {
			it('produces the cooked string value.', () => {
				const tokens: Token[] = [...new Screener(Util.dedent(`
					5 + 03 + '' * 'hello' *  -2;
					'0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6';
					'0 \\u{24} 1 \\u{005f} 2 \\u{} 3';
					'012\\
					345
					678';
				`)).generate()]
				assert.strictEqual(tokens[ 5].cook(), ``)
				assert.strictEqual(tokens[ 7].cook(), `hello`)
				assert.strictEqual(tokens[11].cook(), `0 \' 1 \\ 2 \u0020 3 \t 4 \n 5 \r 6`)
				assert.strictEqual(tokens[13].cook(), `0 $ 1 _ 2 \0 3`)
				assert.strictEqual(tokens[15].cook(), `012 345\n678`)
			})
		})
		context('TokenTemplate', () => {
			it('produces the cooked template value.', () => {
				const tokens: Token[] = [...new Screener(Util.dedent(`
					600  /  '''''' * 3 + '''hello''' *  2;
					3 + '''head{{ * 2
					3 + }}midl{{ * 2
					3 + }}tail''' * 2
					'''0 \\\` 1''';
					'''0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7''';
					'''0 \\u{24} 1 \\u{005f} 2 \\u{} 3''';
					'''012\\
					345
					678''';
				`)).generate()]
				assert.strictEqual(tokens[ 3].cook(), ``)
				assert.strictEqual(tokens[ 7].cook(), `hello`)
				assert.strictEqual(tokens[13].cook(), `head`)
				assert.strictEqual(tokens[18].cook(), `midl`)
				assert.strictEqual(tokens[23].cook(), `tail`)
				assert.strictEqual(tokens[26].cook(), `0 \\\` 1`)
				assert.strictEqual(tokens[28].cook(), `0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7`)
				assert.strictEqual(tokens[30].cook(), `0 \\u{24} 1 \\u{005f} 2 \\u{} 3`)
				assert.strictEqual(tokens[32].cook(), `012\\\n345\n678`)
			})
		})
		context('TokenNumber', () => {
			;[...new Map<string, [string, number[]]>([
				['implicit radix integers', [`
					370  037  +9037  -9037  +06  -06
				`, [
					370, 37, 9037, -9037, 6, -6,
				]]],
				['explicit radix integers', [`
					\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
					\\q320  \\q032  +\\q1032  -\\q1032  +\\q03  -\\q03
					\\o370  \\o037  +\\o1037  -\\o1037  +\\o06  -\\o06
					\\d370  \\d037  +\\d9037  -\\d9037  +\\d06  -\\d06
					\\xe70  \\x0e7  +\\x90e7  -\\x90e7  +\\x06  -\\x06
					\\ze70  \\z0e7  +\\z90e7  -\\z90e7  +\\z06  -\\z06
				`, [
						    4,  1,       8,      -8, 1, -1,
						   56, 14,      78,     -78, 3, -3,
						  248, 31,     543,    -543, 6, -6,
						  370, 37,    9037,   -9037, 6, -6,
						 3696, 231,  37095,  -37095, 6, -6,
						18396, 511, 420415, -420415, 6, -6,
				]]],
				['implicit radix integers with separators', [`
					12_345  +12_345  -12_345  0123_4567  +0123_4567  -0123_4567  012_345_678  +012_345_678  -012_345_678
				`, [
					12345, 12345, -12345, 1234567, 1234567, -1234567, 12345678, 12345678, -12345678,
				]]],
				['explicit radix integers with separators', [`
					\\b1_00  \\b0_01  +\\b1_000  -\\b1_000  +\\b0_1  -\\b0_1
					\\q3_20  \\q0_32  +\\q1_032  -\\q1_032  +\\q0_3  -\\q0_3
					\\o3_70  \\o0_37  +\\o1_037  -\\o1_037  +\\o0_6  -\\o0_6
					\\d3_70  \\d0_37  +\\d9_037  -\\d9_037  +\\d0_6  -\\d0_6
					\\xe_70  \\x0_e7  +\\x9_0e7  -\\x9_0e7  +\\x0_6  -\\x0_6
					\\ze_70  \\z0_e7  +\\z9_0e7  -\\z9_0e7  +\\z0_6  -\\z0_6
				`, [
						    4,  1,       8,      -8, 1, -1,
						   56, 14,      78,     -78, 3, -3,
						  248, 31,     543,    -543, 6, -6,
						  370, 37,    9037,   -9037, 6, -6,
						 3696, 231,  37095,  -37095, 6, -6,
						18396, 511, 420415, -420415, 6, -6,
				]]],
			])].forEach(([name, [source, values]]) => {
				it(`correctly cooks ${name}.`, () => {
					;[...new Screener(source).generate()].filter((token) => token instanceof TokenNumber).forEach((token, i) => {
						assert.strictEqual(token.cook(), values[i])
					})
				})
			})
		})
		context('TokenKeyword', () => {
			it('assigns values 0n–127n to reserved keywords.', () => {
				const tokens: TokenKeyword[] = [...new Screener(`
					let
					unfixed
				`).generate()].filter((token): token is TokenKeyword => token instanceof TokenKeyword)
				const cooked: bigint[] = tokens.map((token) => token.cook())
				assert.deepStrictEqual(cooked, [
					0n,
					1n,
				])
				cooked.forEach((value) => {
					assert.ok(0n <= value, 'cooked value should be >= 0n.')
					assert.ok(value < 128n, 'cooked value should be < 128n.')
				})
			})
		})
		context('TokenIdentifier', () => {
			context('TokenIdentifierBasic', () => {
				it('assigns values 128n or greater to basic identifiers.', () => {
					const tokens: TokenIdentifier[] = [...new Screener(`
						this is a word
						_words _can _start _with _underscores
						_and0 _can1 contain2 numb3rs

						a word _can repeat _with the same id
					`).generate()].filter((token): token is TokenIdentifier => token instanceof TokenIdentifier)
					const cooked: (bigint|null)[] = tokens.map((token) => token.cook())
					cooked.forEach((value) => {
						assert.ok(value !== null, 'cooked value should not be null.')
						assert.ok(value ! >= 128n, 'cooked value should be >= 128n.')
					})
					assert.deepStrictEqual([
						cooked[2],
						cooked[3],
						cooked[5],
						cooked[7],
					], [
						cooked[13],
						cooked[14],
						cooked[15],
						cooked[17],
					], 'identical identifier names should have the same value.')
				})
			})
			context('TokenIdentifierUnicode', () => {
				it('always assigns values 128n or greater.', () => {
					const tokens: TokenIdentifierUnicode[] = [...new Screener(`
						\`this\` \`is\` \`a\` \`unicode word\`
						\`any\` \`unicode word\` \`can\` \`contain\` \`any\` \`character\`
						\`except\` \`back-ticks\` \`.\`
					`).generate()].filter((token): token is TokenIdentifierUnicode => token instanceof TokenIdentifierUnicode)
					const cooked: (bigint|null)[] = tokens.map((token) => token.cook())
					cooked.forEach((value) => {
						assert.ok(value !== null, 'cooked value should not be null.')
						assert.ok(value ! >= 128n, 'cooked value should be >= 128n.')
					})
					assert.deepStrictEqual([
						cooked[3],
						cooked[4],
					], [
						cooked[5],
						cooked[8],
					], 'identical identifier names should have the same value.')
				})
			})
		})
		context('TokenPunctuator', () => {
			it('correctly cooks punctuator tokens.', () => {
				const srcs: string[] = [
					...TokenPunctuator.CHARS_1,
					...TokenPunctuator.CHARS_2,
					...TokenPunctuator.CHARS_3,
				].filter((p) => p !== '')
				assert.deepStrictEqual(
					[...new Screener(srcs.join(' ')).generate()]
						.filter((token): token is TokenPunctuator => token instanceof TokenPunctuator)
						.map((token) => token.cook()),
					srcs,
				)
			})
		})
		it('throws when UTF-16 encoding input is out of range.', () => {
			const stringtoken: Token = [...new Screener(Util.dedent(`
				'a string literal with a unicode \\u{a00061} escape sequence out of range';
			`)).generate()][1]
			assert.throws(() => stringtoken.cook(), RangeError)
		})
	})

	describe('#serialize', () => {
		specify('TokenCommentLine', () => {
			assert.strictEqual([...new Lexer(Util.dedent(`
				500  +  30; ;  % line comment  *  2
				8;
			`)).generate()][11].serialize(), Util.dedent(`
				<COMMENT line="1" col="16">% line comment  *  2\n</COMMENT>
			`).trim())
		})
		specify('TokenCommentMulti', () => {
			assert.strictEqual([...new Lexer(Util.dedent(`
				{% multiline
				that has a {% nestable nested %} multiline
				comment %}
			`)).generate()][2].serialize(), Util.dedent(`
				<COMMENT line="1" col="1">{% multiline
				that has a {% nestable nested %} multiline
				comment %}</COMMENT>
			`).trim())
		})
		specify('TokenCommentBlock', () => {
			assert.strictEqual([...new Lexer(Util.dedent(`
				%%%
				these quotes do not end the doc comment%%%
				%%%nor do these
				%%%
				;
			`)).generate()][2].serialize(), Util.dedent(`
				<COMMENT line="1" col="1">%%%
				these quotes do not end the doc comment%%%
				%%%nor do these
				%%%</COMMENT>
			`).trim())
		})
	})
})
