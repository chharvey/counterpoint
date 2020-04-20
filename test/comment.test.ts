import * as assert from 'assert'

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



suite('Lexer recognizes `TokenCommentLine` conditions.', () => {
	test('Basic line comment.', () => {
		assert.ok([...new Lexer(`
500  +  30; ;  % line comment  *  2
8;
		`.trim()).generate()][11] instanceof TokenCommentLine)
	})

	test('Empty line comment.', () => {
		const comment = [...new Lexer(`
%
8;
		`.trim()).generate()][2]
		assert.ok(comment instanceof TokenCommentLine)
		assert.strictEqual(comment.source, '%\n')
	})

	test('Unfinished line comment throws.', () => {
		;[`
% line comment
		`, `
% line \u0003 comment
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			assert.throws(() => [...lexer.generate()], LexError02)
		})
	})

	test('TokenTokenCommentLine#serialize', () => {
		assert.strictEqual([...new Lexer(`
500  +  30; ;  % line comment  *  2
8;
		`.trim()).generate()][11].serialize(), `
<COMMENT line="1" col="16">% line comment  *  2
</COMMENT>
		`.trim())
	})
})



suite('Lexer recognizes `TokenCommentMulti` conditions.', () => {
	test('Empty multiline comment.', () => {
		const tokens = [...new Lexer(`
{%%}
{% %}
		`.trim()).generate()]
		assert.ok(tokens[2] instanceof TokenCommentMulti)
		assert.ok(tokens[4] instanceof TokenCommentMulti)
		assert.strictEqual(tokens[2].source, '{%%}')
		assert.strictEqual(tokens[4].source, '{% %}')
	})

	test('Nonempty multiline comment.', () => {
		const comment = [...new Lexer(`
{% multiline
that has contents
comment %}
		`.trim()).generate()][2]
		assert.ok(comment instanceof TokenCommentMulti)
	})

	test('Multiline comment containing nested multiline comment.', () => {
		const comment = [...new Lexer(`
{% multiline
that has a {% nestable nested %} multiline
comment %}
		`.trim()).generate()][2]
		assert.ok(comment instanceof TokenCommentMulti)
	})

	test('Multiline comment containing interpolation delimiters.', () => {
		const tokens = [...new Lexer(`
{% A nestable {% co{%mm%}ent %} with '''the {{interpolation}} syntax'''. %}
		`.trim()).generate()]
		assert.ok(tokens[2] instanceof TokenCommentMulti)
		assert.ok(tokens[3] instanceof TokenFilebound)
		assert.strictEqual(tokens[3].cook(), false)
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
			assert.throws(() => [...lexer.generate()], LexError02)
		})
	})

	test('TokenCommentMulti#serialize', () => {
		assert.strictEqual([...new Lexer(`
{% multiline
that has a {% nestable nested %} multiline
comment %}
		`.trim()).generate()][2].serialize(), `
<COMMENT line="1" col="1">{% multiline
that has a {% nestable nested %} multiline
comment %}</COMMENT>
		`.trim())
	})
})



suite('Lexer recognizes `TokenCommentBlock` conditions.', () => {
	test('Empty block comment.', () => {
		const tokens = [...new Lexer(`
%%%
%%%
8;
		`.trim()).generate()]
		assert.ok(tokens[2] instanceof TokenCommentBlock)
		assert.strictEqual(tokens[2].source, '%%%\n%%%')
		assert.strictEqual(tokens[4].source, '8')
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
		assert.ok(tokens[2] instanceof TokenCommentBlock)
		assert.ok(tokens[4] instanceof TokenCommentBlock)
		assert.strictEqual(tokens[6].source, '8')
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
		assert.ok(tokens[ 2] instanceof TokenCommentBlock)
		assert.ok(tokens[ 4] instanceof TokenCommentLine)
		assert.ok(tokens[11] instanceof TokenCommentLine)
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
			assert.throws(() => [...lexer.generate()], LexError02)
		})
	})

	test('TokenCommentBlock#serialize', () => {
		assert.strictEqual([...new Lexer(`
%%%
these quotes do not end the doc comment%%%
%%%nor do these
%%%
;
		`.trim()).generate()][2].serialize(), `
<COMMENT line="1" col="1">%%%
these quotes do not end the doc comment%%%
%%%nor do these
%%%</COMMENT>
		`.trim())
	})
})
