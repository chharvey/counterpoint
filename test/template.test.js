const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')
const {
	TokenTemplate,
	TemplatePosition,
} = require('../build/class/Token.class.js')
const {
	LexError01,
	LexError02,
} = require('../build/error/LexError.class.js')



describe('Lexer recognizes `TokenTemplate` conditions.', () => {
	test('Basic templates.', () => {
		const tokens = [...new Lexer(`
600  /  \`\` * 3 + \`hello\` *  2
		`.trim()).generate()]
		expect(tokens[ 6]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 6].position).toBe(TemplatePosition.FULL)
		expect(tokens[ 6].source.length).toBe(2)
		expect(tokens[14]).toBeInstanceOf(TokenTemplate)
		expect(tokens[14].position).toBe(TemplatePosition.FULL)
		expect(tokens[14].source).toBe(`\`hello\``)
	})

	test('Template interpolation.', () => {
		const tokens = [...new Lexer(`
3 + \`head{{ * 2
3 + }}midl{{ * 2
3 + }}tail\` * 2
		`.trim()).generate()]
		expect(tokens[ 6]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 6].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 6].source).toBe(`\`head{{`)
		expect(tokens[16]).toBeInstanceOf(TokenTemplate)
		expect(tokens[16].position).toBe(TemplatePosition.MIDDLE)
		expect(tokens[16].source).toBe(`}}midl{{`)
		expect(tokens[26]).toBeInstanceOf(TokenTemplate)
		expect(tokens[26].position).toBe(TemplatePosition.TAIL)
		expect(tokens[26].source).toBe(`}}tail\``)
	})

	test('Empty/comment interpolation.', () => {
		const tokens = [...new Lexer(`
\`abc{{ }}def\`
\`ghi{{}}jkl\`
\`mno{{ "pqr" }}stu\`
		`.trim()).generate()]
		expect(tokens[ 2]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 2].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 2].source).toBe(`\`abc{{`)
		expect(tokens[ 4]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 4].position).toBe(TemplatePosition.TAIL)
		expect(tokens[ 4].source).toBe(`}}def\``)
		expect(tokens[ 6]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 6].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 6].source).toBe(`\`ghi{{`)
		expect(tokens[ 7]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 7].position).toBe(TemplatePosition.TAIL)
		expect(tokens[ 7].source).toBe(`}}jkl\``)
		expect(tokens[ 9]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 9].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 9].source).toBe(`\`mno{{`)
		expect(tokens[13]).toBeInstanceOf(TokenTemplate)
		expect(tokens[13].position).toBe(TemplatePosition.TAIL)
		expect(tokens[13].source).toBe(`}}stu\``)
	})

	test('Nested interpolation.', () => {
		const tokens = [...new Lexer(`
1 + \`head1 {{ 2 + \`head2 {{ 3 ^ 3 }} tail2\` * 2 }} tail1\` * 1
		`.trim()).generate()]
		expect(tokens[ 6]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 6].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 6].source).toBe(`\`head1 {{`)
		expect(tokens[12]).toBeInstanceOf(TokenTemplate)
		expect(tokens[12].position).toBe(TemplatePosition.HEAD)
		expect(tokens[12].source).toBe(`\`head2 {{`)
		expect(tokens[20]).toBeInstanceOf(TokenTemplate)
		expect(tokens[20].position).toBe(TemplatePosition.TAIL)
		expect(tokens[20].source).toBe(`}} tail2\``)
		expect(tokens[26]).toBeInstanceOf(TokenTemplate)
		expect(tokens[26].position).toBe(TemplatePosition.TAIL)
		expect(tokens[26].source).toBe(`}} tail1\``)
	})

	test('Escaped characters.', () => {
		const tokentemplate = [...new Lexer(`
\`0 \\\` 1\`;
		`.trim()).generate()][2]
		expect(tokentemplate.source.slice(3, 5)).toBe(`\\\``)
	})

	test('Non-escaped characters.', () => {
		const tokentemplate = [...new Lexer(`
\`0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7\`;
		`.trim()).generate()][2]
		expect(tokentemplate.source.slice( 3,  5)).toBe(`\\'`)
		expect(tokentemplate.source.slice( 8, 10)).toBe(`\\\\`)
		expect(tokentemplate.source.slice(13, 15)).toBe(`\\s`)
		expect(tokentemplate.source.slice(18, 20)).toBe(`\\t`)
		expect(tokentemplate.source.slice(23, 25)).toBe(`\\n`)
		expect(tokentemplate.source.slice(28, 30)).toBe(`\\r`)
		expect(tokentemplate.source.slice(33, 36)).toBe(`\\\\\``)
	})

	test('Non-escaped character sequences.', () => {
		const tokentemplate = [...new Lexer(`
\`0 \\u{24} 1 \\u{005f} 2 \\u{} 3\`;
		`.trim()).generate()][2]
		expect(tokentemplate.source.slice( 3,  9)).toBe(`\\u{24}`)
		expect(tokentemplate.source.slice(12, 20)).toBe(`\\u{005f}`)
		expect(tokentemplate.source.slice(23, 27)).toBe(`\\u{}`)
	})

	test('Line breaks.', () => {
		const tokentemplate = [...new Lexer(`
\`012\\
345
678\`;
		`.trim()).generate()][2]
		expect(tokentemplate.source.slice(4,  6)).toBe(`\\\n`)
		expect(tokentemplate.source.slice(9, 10)).toBe(`\n`)
	})

	test('Unfinished template throws.', () => {
		;[`
\`template without end delimiter
		`, `
\`template with end delimiter but contains \u0003 character\`
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})

	test('Invalid characters at end of template.', () => {
		;[`
\`template-head that ends with a single open brace {{{
		`, `
}}template-middle that ends with a single open brace {{{
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError01)
		})
	})
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
