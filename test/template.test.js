const {default: Lexer} = require('../build/class/Lexer.class.js')
const {default: Screener} = require('../build/class/Screener.class.js')
const {default: Parser} = require('../build/class/Parser.class.js')
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



describe('Parse `StringTemplate` expression units.', () => {
	const stringTemplateParseNode = (goal) => goal
		.children[1] // Goal__0__List
		.children[0] // Statement
		.children[0] // Expression
		.children[0] // ExpressionAdditive
		.children[0] // ExpressionMultiplicative
		.children[0] // ExpressionExponential
		.children[0] // ExpressionUnarySymbol
		.children[0] // ExpressionUnit
		.children[0] // StringTemplate

	test('Head, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
\`head1{{}}tail1\`;
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="\`head1{{ }}tail1\`">
	<TEMPLATE line="1" col="1" value="head1">\`head1{{</TEMPLATE>
	<TEMPLATE line="1" col="9" value="tail1">}}tail1\`</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
\`head1{{ \`full1\` }}tail1\`;
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="\`head1{{ \`full1\` }}tail1\`">
	<TEMPLATE line="1" col="1" value="head1">\`head1{{</TEMPLATE>
	<Expression line="1" col="10" source="\`full1\`">
		<ExpressionAdditive line="1" col="10" source="\`full1\`">
			<ExpressionMultiplicative line="1" col="10" source="\`full1\`">
				<ExpressionExponential line="1" col="10" source="\`full1\`">
					<ExpressionUnarySymbol line="1" col="10" source="\`full1\`">
						<ExpressionUnit line="1" col="10" source="\`full1\`">
							<StringTemplate line="1" col="10" source="\`full1\`">
								<TEMPLATE line="1" col="10" value="full1">\`full1\`</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<TEMPLATE line="1" col="18" value="tail1">}}tail1\`</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
\`head1{{ \`full1\` }}midd1{{}}tail1\`;
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="\`head1{{ \`full1\` }}midd1{{ }}tail1\`">
	<TEMPLATE line="1" col="1" value="head1">\`head1{{</TEMPLATE>
	<Expression line="1" col="10" source="\`full1\`">
		<ExpressionAdditive line="1" col="10" source="\`full1\`">
			<ExpressionMultiplicative line="1" col="10" source="\`full1\`">
				<ExpressionExponential line="1" col="10" source="\`full1\`">
					<ExpressionUnarySymbol line="1" col="10" source="\`full1\`">
						<ExpressionUnit line="1" col="10" source="\`full1\`">
							<StringTemplate line="1" col="10" source="\`full1\`">
								<TEMPLATE line="1" col="10" value="full1">\`full1\`</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<StringTemplate__0__List line="1" col="18" source="}}midd1{{">
		<TEMPLATE line="1" col="18" value="midd1">}}midd1{{</TEMPLATE>
	</StringTemplate__0__List>
	<TEMPLATE line="1" col="27" value="tail1">}}tail1\`</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
\`head1{{ \`full1\` }}midd1{{ \`full2\` }}tail1\`;
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="\`head1{{ \`full1\` }}midd1{{ \`full2\` }}tail1\`">
	<TEMPLATE line="1" col="1" value="head1">\`head1{{</TEMPLATE>
	<Expression line="1" col="10" source="\`full1\`">
		<ExpressionAdditive line="1" col="10" source="\`full1\`">
			<ExpressionMultiplicative line="1" col="10" source="\`full1\`">
				<ExpressionExponential line="1" col="10" source="\`full1\`">
					<ExpressionUnarySymbol line="1" col="10" source="\`full1\`">
						<ExpressionUnit line="1" col="10" source="\`full1\`">
							<StringTemplate line="1" col="10" source="\`full1\`">
								<TEMPLATE line="1" col="10" value="full1">\`full1\`</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<StringTemplate__0__List line="1" col="18" source="}}midd1{{ \`full2\`">
		<TEMPLATE line="1" col="18" value="midd1">}}midd1{{</TEMPLATE>
		<Expression line="1" col="28" source="\`full2\`">
			<ExpressionAdditive line="1" col="28" source="\`full2\`">
				<ExpressionMultiplicative line="1" col="28" source="\`full2\`">
					<ExpressionExponential line="1" col="28" source="\`full2\`">
						<ExpressionUnarySymbol line="1" col="28" source="\`full2\`">
							<ExpressionUnit line="1" col="28" source="\`full2\`">
								<StringTemplate line="1" col="28" source="\`full2\`">
									<TEMPLATE line="1" col="28" value="full2">\`full2\`</TEMPLATE>
								</StringTemplate>
							</ExpressionUnit>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionMultiplicative>
			</ExpressionAdditive>
		</Expression>
	</StringTemplate__0__List>
	<TEMPLATE line="1" col="36" value="tail1">}}tail1\`</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, middle, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
\`head1{{ \`full1\` }}midd1{{ \`full2\` }}midd2{{}}tail1\`;
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="\`head1{{ \`full1\` }}midd1{{ \`full2\` }}midd2{{ }}tail1\`">
	<TEMPLATE line="1" col="1" value="head1">\`head1{{</TEMPLATE>
	<Expression line="1" col="10" source="\`full1\`">
		<ExpressionAdditive line="1" col="10" source="\`full1\`">
			<ExpressionMultiplicative line="1" col="10" source="\`full1\`">
				<ExpressionExponential line="1" col="10" source="\`full1\`">
					<ExpressionUnarySymbol line="1" col="10" source="\`full1\`">
						<ExpressionUnit line="1" col="10" source="\`full1\`">
							<StringTemplate line="1" col="10" source="\`full1\`">
								<TEMPLATE line="1" col="10" value="full1">\`full1\`</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<StringTemplate__0__List line="1" col="18" source="}}midd1{{ \`full2\` }}midd2{{">
		<StringTemplate__0__List line="1" col="18" source="}}midd1{{ \`full2\`">
			<TEMPLATE line="1" col="18" value="midd1">}}midd1{{</TEMPLATE>
			<Expression line="1" col="28" source="\`full2\`">
				<ExpressionAdditive line="1" col="28" source="\`full2\`">
					<ExpressionMultiplicative line="1" col="28" source="\`full2\`">
						<ExpressionExponential line="1" col="28" source="\`full2\`">
							<ExpressionUnarySymbol line="1" col="28" source="\`full2\`">
								<ExpressionUnit line="1" col="28" source="\`full2\`">
									<StringTemplate line="1" col="28" source="\`full2\`">
										<TEMPLATE line="1" col="28" value="full2">\`full2\`</TEMPLATE>
									</StringTemplate>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
		</StringTemplate__0__List>
		<TEMPLATE line="1" col="36" value="midd2">}}midd2{{</TEMPLATE>
	</StringTemplate__0__List>
	<TEMPLATE line="1" col="45" value="tail1">}}tail1\`</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, middle, expr, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
\`head1{{ \`full1\` }}midd1{{ \`full2\` }}midd2{{ \`head2{{ \`full3\` }}tail2\` }}tail1\`;
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="\`head1{{ \`full1\` }}midd1{{ \`full2\` }}midd2{{ \`head2{{ \`full3\` }}tail2\` }}tail1\`">
	<TEMPLATE line="1" col="1" value="head1">\`head1{{</TEMPLATE>
	<Expression line="1" col="10" source="\`full1\`">
		<ExpressionAdditive line="1" col="10" source="\`full1\`">
			<ExpressionMultiplicative line="1" col="10" source="\`full1\`">
				<ExpressionExponential line="1" col="10" source="\`full1\`">
					<ExpressionUnarySymbol line="1" col="10" source="\`full1\`">
						<ExpressionUnit line="1" col="10" source="\`full1\`">
							<StringTemplate line="1" col="10" source="\`full1\`">
								<TEMPLATE line="1" col="10" value="full1">\`full1\`</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<StringTemplate__0__List line="1" col="18" source="}}midd1{{ \`full2\` }}midd2{{ \`head2{{ \`full3\` }}tail2\`">
		<StringTemplate__0__List line="1" col="18" source="}}midd1{{ \`full2\`">
			<TEMPLATE line="1" col="18" value="midd1">}}midd1{{</TEMPLATE>
			<Expression line="1" col="28" source="\`full2\`">
				<ExpressionAdditive line="1" col="28" source="\`full2\`">
					<ExpressionMultiplicative line="1" col="28" source="\`full2\`">
						<ExpressionExponential line="1" col="28" source="\`full2\`">
							<ExpressionUnarySymbol line="1" col="28" source="\`full2\`">
								<ExpressionUnit line="1" col="28" source="\`full2\`">
									<StringTemplate line="1" col="28" source="\`full2\`">
										<TEMPLATE line="1" col="28" value="full2">\`full2\`</TEMPLATE>
									</StringTemplate>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
		</StringTemplate__0__List>
		<TEMPLATE line="1" col="36" value="midd2">}}midd2{{</TEMPLATE>
		<Expression line="1" col="46" source="\`head2{{ \`full3\` }}tail2\`">
			<ExpressionAdditive line="1" col="46" source="\`head2{{ \`full3\` }}tail2\`">
				<ExpressionMultiplicative line="1" col="46" source="\`head2{{ \`full3\` }}tail2\`">
					<ExpressionExponential line="1" col="46" source="\`head2{{ \`full3\` }}tail2\`">
						<ExpressionUnarySymbol line="1" col="46" source="\`head2{{ \`full3\` }}tail2\`">
							<ExpressionUnit line="1" col="46" source="\`head2{{ \`full3\` }}tail2\`">
								<StringTemplate line="1" col="46" source="\`head2{{ \`full3\` }}tail2\`">
									<TEMPLATE line="1" col="46" value="head2">\`head2{{</TEMPLATE>
									<Expression line="1" col="55" source="\`full3\`">
										<ExpressionAdditive line="1" col="55" source="\`full3\`">
											<ExpressionMultiplicative line="1" col="55" source="\`full3\`">
												<ExpressionExponential line="1" col="55" source="\`full3\`">
													<ExpressionUnarySymbol line="1" col="55" source="\`full3\`">
														<ExpressionUnit line="1" col="55" source="\`full3\`">
															<StringTemplate line="1" col="55" source="\`full3\`">
																<TEMPLATE line="1" col="55" value="full3">\`full3\`</TEMPLATE>
															</StringTemplate>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionExponential>
											</ExpressionMultiplicative>
										</ExpressionAdditive>
									</Expression>
									<TEMPLATE line="1" col="63" value="tail2">}}tail2\`</TEMPLATE>
								</StringTemplate>
							</ExpressionUnit>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionMultiplicative>
			</ExpressionAdditive>
		</Expression>
	</StringTemplate__0__List>
	<TEMPLATE line="1" col="72" value="tail1">}}tail1\`</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Orphaned head throws.', () => {
		expect(() => new Parser(`
\`A string template head token not followed by a middle or tail {{ 1;
		`.trim()).parse()).toThrow('Unexpected token')
	})

	test('Orphaned middle throws.', () => {
		expect(() => new Parser(`
2 }} a string template middle token not preceded by a head/middle and not followed by a middle/tail {{ 3;
		`.trim()).parse()).toThrow('Unexpected token')
	})

	test('Orphaned tail throws.', () => {
		expect(() => new Parser(`
4 }} a string template tail token not preceded by a head or middle\`;
		`.trim()).parse()).toThrow('Unexpected token')
	})
})



describe('Decorate `StringTemplate` expression units.', () => {
	const stringTemplateSemanticNode = (goal) => goal
		.children[0] // StatementList
		.children[0] // Statement
		.children[0] // Template

	test('Head, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
\`head1{{}}tail1\`;
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="\`head1{{ }}tail1\`">
	<Constant line="1" col="1" source="\`head1{{" value="head1"/>
	<Constant line="1" col="9" source="}}tail1\`" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
\`head1{{ \`full1\` }}tail1\`;
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="\`head1{{ \`full1\` }}tail1\`">
	<Constant line="1" col="1" source="\`head1{{" value="head1"/>
	<Template line="1" col="10" source="\`full1\`">
		<Constant line="1" col="10" source="\`full1\`" value="full1"/>
	</Template>
	<Constant line="1" col="18" source="}}tail1\`" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
\`head1{{ \`full1\` }}midd1{{}}tail1\`;
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="\`head1{{ \`full1\` }}midd1{{ }}tail1\`">
	<Constant line="1" col="1" source="\`head1{{" value="head1"/>
	<Template line="1" col="10" source="\`full1\`">
		<Constant line="1" col="10" source="\`full1\`" value="full1"/>
	</Template>
	<Constant line="1" col="18" source="}}midd1{{" value="midd1"/>
	<Constant line="1" col="27" source="}}tail1\`" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
\`head1{{ \`full1\` }}midd1{{ \`full2\` }}tail1\`;
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="\`head1{{ \`full1\` }}midd1{{ \`full2\` }}tail1\`">
	<Constant line="1" col="1" source="\`head1{{" value="head1"/>
	<Template line="1" col="10" source="\`full1\`">
		<Constant line="1" col="10" source="\`full1\`" value="full1"/>
	</Template>
	<Constant line="1" col="18" source="}}midd1{{" value="midd1"/>
	<Template line="1" col="28" source="\`full2\`">
		<Constant line="1" col="28" source="\`full2\`" value="full2"/>
	</Template>
	<Constant line="1" col="36" source="}}tail1\`" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, middle, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
\`head1{{ \`full1\` }}midd1{{ \`full2\` }}midd2{{}}tail1\`;
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="\`head1{{ \`full1\` }}midd1{{ \`full2\` }}midd2{{ }}tail1\`">
	<Constant line="1" col="1" source="\`head1{{" value="head1"/>
	<Template line="1" col="10" source="\`full1\`">
		<Constant line="1" col="10" source="\`full1\`" value="full1"/>
	</Template>
	<Constant line="1" col="18" source="}}midd1{{" value="midd1"/>
	<Template line="1" col="28" source="\`full2\`">
		<Constant line="1" col="28" source="\`full2\`" value="full2"/>
	</Template>
	<Constant line="1" col="36" source="}}midd2{{" value="midd2"/>
	<Constant line="1" col="45" source="}}tail1\`" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, middle, expr, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
\`head1{{ \`full1\` }}midd1{{ \`full2\` }}midd2{{ \`head2{{ \`full3\` }}tail2\` }}tail1\`;
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="\`head1{{ \`full1\` }}midd1{{ \`full2\` }}midd2{{ \`head2{{ \`full3\` }}tail2\` }}tail1\`">
	<Constant line="1" col="1" source="\`head1{{" value="head1"/>
	<Template line="1" col="10" source="\`full1\`">
		<Constant line="1" col="10" source="\`full1\`" value="full1"/>
	</Template>
	<Constant line="1" col="18" source="}}midd1{{" value="midd1"/>
	<Template line="1" col="28" source="\`full2\`">
		<Constant line="1" col="28" source="\`full2\`" value="full2"/>
	</Template>
	<Constant line="1" col="36" source="}}midd2{{" value="midd2"/>
	<Template line="1" col="46" source="\`head2{{ \`full3\` }}tail2\`">
		<Constant line="1" col="46" source="\`head2{{" value="head2"/>
		<Template line="1" col="55" source="\`full3\`">
			<Constant line="1" col="55" source="\`full3\`" value="full3"/>
		</Template>
		<Constant line="1" col="63" source="}}tail2\`" value="tail2"/>
	</Template>
	<Constant line="1" col="72" source="}}tail1\`" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})
})
