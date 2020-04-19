import Lexer from '../src/class/Lexer.class'
import {
	TokenFilebound,
	TokenWhitespace,
	TokenCommentLine,
	TokenCommentMulti,
	TokenCommentBlock,
} from '../src/class/Token.class'
import {
	LexError02,
	LexError03,
} from '../src/error/LexError.class'



describe('Lexer recognizes `TokenCommentLine` conditions.', () => {
	test('Basic line comment.', () => {
		expect([...new Lexer(`
500  +  30; ;  % line comment  *  2
8;
		`.trim()).generate()][11]).toBeInstanceOf(TokenCommentLine)
	})

	test('Empty line comment.', () => {
		const comment = [...new Lexer(`
%
8;
		`.trim()).generate()][2]
		expect(comment).toBeInstanceOf(TokenCommentLine)
		expect(comment.source).toBe('%\n')
	})

	test('Unfinished line comment throws.', () => {
		;[`
% line comment
		`, `
% line \u0003 comment
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})

	test('TokenTokenCommentLine#serialize', () => {
		expect([...new Lexer(`
500  +  30; ;  % line comment  *  2
8;
		`.trim()).generate()][11].serialize()).toBe(`
<COMMENT line="1" col="16">% line comment  *  2
</COMMENT>
		`.trim())
	})
})



describe('Lexer recognizes `TokenCommentMulti` conditions.', () => {
	test('Empty multiline comment.', () => {
		const tokens = [...new Lexer(`
{%%}
{% %}
		`.trim()).generate()]
		expect(tokens[2]).toBeInstanceOf(TokenCommentMulti)
		expect(tokens[4]).toBeInstanceOf(TokenCommentMulti)
		expect(tokens[2].source).toBe('{%%}')
		expect(tokens[4].source).toBe('{% %}')
	})

	test('Nonempty multiline comment.', () => {
		const comment = [...new Lexer(`
{% multiline
that has contents
comment %}
		`.trim()).generate()][2]
		expect(comment).toBeInstanceOf(TokenCommentMulti)
	})

	test('Multiline comment containing nested multiline comment.', () => {
		const comment = [...new Lexer(`
{% multiline
that has a {% nestable nested %} multiline
comment %}
		`.trim()).generate()][2]
		expect(comment).toBeInstanceOf(TokenCommentMulti)
	})

	test('Multiline comment containing interpolation delimiters.', () => {
		const tokens = [...new Lexer(`
{% A nestable {% co{%mm%}ent %} with '''the {{interpolation}} syntax'''. %}
		`.trim()).generate()]
		expect(tokens[2]).toBeInstanceOf(TokenCommentMulti)
		expect(tokens[3]).toBeInstanceOf(TokenFilebound)
		expect(tokens[3].cook()).toBe(false)
	})

	test('Unfinished multiline comment throws.', () => {
		;[`
{%multiline
comment
		`, `
{%multiline
{%comm%}ent
		`, `
{%multiline
\u0003
{%comm%}ent%}
		`, `
{%multiline
{%co\u0003mm%}ent%}
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})

	test('TokenCommentMulti#serialize', () => {
		expect([...new Lexer(`
{% multiline
that has a {% nestable nested %} multiline
comment %}
		`.trim()).generate()][2].serialize()).toBe(`
<COMMENT line="1" col="1">{% multiline
that has a {% nestable nested %} multiline
comment %}</COMMENT>
		`.trim())
	})
})



describe('Lexer recognizes `TokenCommentBlock` conditions.', () => {
	test('Empty block comment.', () => {
		const tokens = [...new Lexer(`
%%%
%%%
8;
		`.trim()).generate()]
		expect(tokens[2]).toBeInstanceOf(TokenCommentBlock)
		expect(tokens[2].source).toBe('%%%\n%%%')
		expect(tokens[4].source).toBe('8')
	})

	test('Basic block comment.', () => {
		const tokens = [...new Lexer(`
%%%
abcde
5 + 3
%%%

	%%%
	abcde
	5 + 3
	%%%
8;
		`.trim()).generate()]
		expect(tokens[2]).toBeInstanceOf(TokenCommentBlock)
		expect(tokens[4]).toBeInstanceOf(TokenCommentBlock)
		expect(tokens[6].source).toBe('8')
	})

	test('Block comment delimiters must be on own line.', () => {
		const tokens = [...new Lexer(`
%%%
these quotes do not end the doc comment%%%
%%%nor do these
%%%

%%% 3 * 2
5 + 3 %%%
8;
		`.trim()).generate()]
		expect(tokens[ 2]).toBeInstanceOf(TokenCommentBlock)
		expect(tokens[ 4]).toBeInstanceOf(TokenCommentLine)
		expect(tokens[11]).toBeInstanceOf(TokenCommentLine)
	})

	test('Unfinished block comment throws.', () => {
		;[`
%%%
block comment without end delimiters
		`, `
%%%
block comment with end delimiter, but not followed by a newline
%%%
		`, `
%%%
block comment containing \u0003 character
%%%
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})

	test('TokenCommentBlock#serialize', () => {
		expect([...new Lexer(`
%%%
these quotes do not end the doc comment%%%
%%%nor do these
%%%
;
		`.trim()).generate()][2].serialize()).toBe(`
<COMMENT line="1" col="1">%%%
these quotes do not end the doc comment%%%
%%%nor do these
%%%</COMMENT>
		`.trim())
	})
})
