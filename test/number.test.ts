import Scanner  from '../src/class/Scanner.class'
import Lexer    from '../src/class/Lexer.class'
import Screener from '../src/class/Screener.class'
import Char     from '../src/class/Char.class'
import {
	TokenWhitespace,
	TokenNumber,
	TokenWord,
} from '../src/class/Token.class'
import {
	LexError03,
	LexError04,
} from '../src/error/LexError.class'



describe('Non-radix (decimal default) integers.', () => {
	test('Single-digit numbers.', () => {
		;[...new Lexer(TokenNumber.DIGITS.get(10n).join(' ')).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
			expect(token).toBeInstanceOf(TokenNumber)
		})
	})

	test('Tokenize non-radix integers.', () => {
		const tokens = [...new Lexer(`
+  55  -  33  2  007  700  +91  -27  +091  -0027
		`.trim()).generate()]
		expect(tokens[ 4].source).toBe(`55`)
		expect(tokens[ 8].source).toBe(`33`)
		expect(tokens[10].source).toBe(`2`)
		expect(tokens[12].source).toBe(`007`)
		expect(tokens[14].source).toBe(`700`)
		expect(tokens[16].source).toBe(`+91`)
		expect(tokens[18].source).toBe(`-27`)
		expect(tokens[20].source).toBe(`+091`)
		expect(tokens[22].source).toBe(`-0027`)
	})

	test('Cook non-radix integers.', () => {
		;[...new Screener(`
370  037  +9037  -9037  +06  -06
		`.trim()).generate()].filter((token) => token instanceof TokenNumber).forEach((token, i) => {
			expect(token.cook()).toBe([370, 37, 9037, -9037, 6, -6][i])
		})
	})
})



describe('Radix-specific integers.', () => {
	test('Single-digit numbers.', () => {
		;[...TokenNumber.BASES].map(([base, radix]) =>
			[...new Lexer(
				TokenNumber.DIGITS.get(radix).map((d) => `\\${base}${d}`).join(' ')
			).generate()].slice(1, -1)
		).flat().filter((token) => !(token instanceof TokenWhitespace)).forEach((token) => {
			expect(token).toBeInstanceOf(TokenNumber)
		})
	})

	test('Tokenize radix integers.', () => {
		const source = `
\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
\\q320  \\q032  +\\q1032  -\\q1032  +\\q03  -\\q03
\\o370  \\o037  +\\o1037  -\\o1037  +\\o06  -\\o06
\\d370  \\d037  +\\d9037  -\\d9037  +\\d06  -\\d06
\\xe70  \\x0e7  +\\x90e7  -\\x90e7  +\\x06  -\\x06
\\ze70  \\z0e7  +\\z90e7  -\\z90e7  +\\z06  -\\z06
		`.trim().replace(/\n/g, '  ')
		;[...new Lexer(source).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token, i) => {
			expect(token).toBeInstanceOf(TokenNumber)
			expect(token.source).toBe(source.split('  ')[i])
		})
	})

	test('Cook radix integers.', () => {
		;[...new Screener(`
\\b100  \\b001  +\\b1000  -\\b1000  +\\b01  -\\b01
\\q320  \\q032  +\\q1032  -\\q1032  +\\q03  -\\q03
\\o370  \\o037  +\\o1037  -\\o1037  +\\o06  -\\o06
\\d370  \\d037  +\\d9037  -\\d9037  +\\d06  -\\d06
\\xe70  \\x0e7  +\\x90e7  -\\x90e7  +\\x06  -\\x06
\\ze70  \\z0e7  +\\z90e7  -\\z90e7  +\\z06  -\\z06
		`.trim()).generate()].filter((token) => token instanceof TokenNumber).forEach((token, i) => {
			expect(token.cook()).toBe([
				    4,  1,       8,      -8, 1, -1,
				   56, 14,      78,     -78, 3, -3,
				  248, 31,     543,    -543, 6, -6,
				  370, 37,    9037,   -9037, 6, -6,
				 3696, 231,  37095,  -37095, 6, -6,
				18396, 511, 420415, -420415, 6, -6,
			][i])
		})
	})

	test('Integers with invalid digits start a new token.', () => {
		expect([...new Screener(`
\\b1_0040_0000
\\q123_142_3
\\o123_456_78
		`.trim()).generate()].slice(1, -1).map((token) => token.cook()))
			.toEqual([4, 400000, 109, 423, 342391, 8])
	})

	test('Invalid sequence.', () => {
		expect([...new Screener(`
\\d39c
		`.trim()).generate()].slice(1, -1).map((token) => token.source))
			.toEqual(['\\d39', 'c'])
	})

	test('Invalid escape characters.', () => {
		`
 \\a0  \\c0  \\e0  \\f0  \\g0  \\h0  \\i0  \\j0  \\k0  \\l0  \\m0  \\n0  \\p0  \\r0  \\s0  \\t0  \\u0  \\v0  \\w0  \\y0  \\
+\\a0 +\\c0 +\\e0 +\\f0 +\\g0 +\\h0 +\\i0 +\\j0 +\\k0 +\\l0 +\\m0 +\\n0 +\\p0 +\\r0 +\\s0 +\\t0 +\\u0 +\\v0 +\\w0 +\\y0 +\\
-\\a0 -\\c0 -\\e0 -\\f0 -\\g0 -\\h0 -\\i0 -\\j0 -\\k0 -\\l0 -\\m0 -\\n0 -\\p0 -\\r0 -\\s0 -\\t0 -\\u0 -\\v0 -\\w0 -\\y0 -\\
		`.trim().split(' ').filter((src) => src !== '').map((src) => new Lexer(src)).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError03)
		})
	})
})



describe('Non-radix (decimal default) integers with numeric separators.', () => {
	const SOURCE = `
12_345  +12_345  -12_345  0123_4567  +0123_4567  -0123_4567  012_345_678  +012_345_678  -012_345_678
	`.trim()

	test('Tokenize non-radix integers with separators.', () => {
		;[...new Lexer(SOURCE).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token, i) => {
			expect(token).toBeInstanceOf(TokenNumber)
			expect(token.source).toBe(SOURCE.split('  ')[i])
		})
	})

	test('Cook non-radix integers with separators.', () => {
		;[...new Screener(SOURCE).generate()].filter((token) => token instanceof TokenNumber).forEach((token, i) => {
			expect(token.cook()).toBe([12345, 12345, -12345, 1234567, 1234567, -1234567, 12345678, 12345678, -12345678][i])
		})
	})

	test('Numeric separator cannot appear at end of token.', () => {
		expect(() => [...new Lexer(`12_345_`).generate()]).toThrow(LexError04)
	})

	test('Numeric separators cannot appear consecutively.', () => {
		expect(() => [...new Lexer(`12__345`).generate()]).toThrow(LexError04)
	})

	test('Numeric separator at beginning of token is not a number token.', () => {
		const token = [...new Lexer(`_12345`).generate()][2]
		expect(token).not.toBeInstanceOf(TokenNumber)
	})
})



describe('Radix-specific integers with numeric separators.', () => {
	const SOURCE = `
\\b1_00  \\b0_01  +\\b1_000  -\\b1_000  +\\b0_1  -\\b0_1
\\q3_20  \\q0_32  +\\q1_032  -\\q1_032  +\\q0_3  -\\q0_3
\\o3_70  \\o0_37  +\\o1_037  -\\o1_037  +\\o0_6  -\\o0_6
\\d3_70  \\d0_37  +\\d9_037  -\\d9_037  +\\d0_6  -\\d0_6
\\xe_70  \\x0_e7  +\\x9_0e7  -\\x9_0e7  +\\x0_6  -\\x0_6
\\ze_70  \\z0_e7  +\\z9_0e7  -\\z9_0e7  +\\z0_6  -\\z0_6
	`.trim().replace(/\n/g, '  ')

	test('Tokenize radix integers with separators.', () => {
		;[...new Lexer(SOURCE).generate()].slice(1, -1).filter((token) => !(token instanceof TokenWhitespace)).forEach((token, i) => {
			expect(token).toBeInstanceOf(TokenNumber)
			expect(token.source).toBe(SOURCE.split('  ')[i])
		})
	})

	test('Cook radix integers with separators.', () => {
		;[...new Screener(SOURCE).generate()].filter((token) => token instanceof TokenNumber).forEach((token, i) => {
			expect(token.cook()).toBe([
				    4,  1,       8,      -8, 1, -1,
				   56, 14,      78,     -78, 3, -3,
				  248, 31,     543,    -543, 6, -6,
				  370, 37,    9037,   -9037, 6, -6,
				 3696, 231,  37095,  -37095, 6, -6,
				18396, 511, 420415, -420415, 6, -6,
			][i])
		})
	})
})
