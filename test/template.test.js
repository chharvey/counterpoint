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
600  /  '''''' * 3 + '''hello''' *  2
		`.trim()).generate()]
		expect(tokens[ 6]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 6].position).toBe(TemplatePosition.FULL)
		expect(tokens[ 6].source.length).toBe(6)
		expect(tokens[14]).toBeInstanceOf(TokenTemplate)
		expect(tokens[14].position).toBe(TemplatePosition.FULL)
		expect(tokens[14].source).toBe(`'''hello'''`)
	})

	test('Template interpolation.', () => {
		const tokens = [...new Lexer(`
3 + '''head{{ * 2
3 + }}midl{{ * 2
3 + }}tail''' * 2
		`.trim()).generate()]
		expect(tokens[ 6]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 6].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 6].source).toBe(`'''head{{`)
		expect(tokens[16]).toBeInstanceOf(TokenTemplate)
		expect(tokens[16].position).toBe(TemplatePosition.MIDDLE)
		expect(tokens[16].source).toBe(`}}midl{{`)
		expect(tokens[26]).toBeInstanceOf(TokenTemplate)
		expect(tokens[26].position).toBe(TemplatePosition.TAIL)
		expect(tokens[26].source).toBe(`}}tail'''`)
	})

	test('Empty/comment interpolation.', () => {
		const tokens = [...new Lexer(`
'''abc{{ }}def'''
'''ghi{{}}jkl'''
'''mno{{ {% pqr %} }}stu'''
		`.trim()).generate()]
		expect(tokens[ 2]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 2].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 2].source).toBe(`'''abc{{`)
		expect(tokens[ 4]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 4].position).toBe(TemplatePosition.TAIL)
		expect(tokens[ 4].source).toBe(`}}def'''`)
		expect(tokens[ 6]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 6].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 6].source).toBe(`'''ghi{{`)
		expect(tokens[ 7]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 7].position).toBe(TemplatePosition.TAIL)
		expect(tokens[ 7].source).toBe(`}}jkl'''`)
		expect(tokens[ 9]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 9].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 9].source).toBe(`'''mno{{`)
		expect(tokens[13]).toBeInstanceOf(TokenTemplate)
		expect(tokens[13].position).toBe(TemplatePosition.TAIL)
		expect(tokens[13].source).toBe(`}}stu'''`)
	})

	test('Nested interpolation.', () => {
		const tokens = [...new Lexer(`
1 + '''head1 {{ 2 + '''head2 {{ 3 ^ 3 }} tail2''' * 2 }} tail1''' * 1
		`.trim()).generate()]
		expect(tokens[ 6]).toBeInstanceOf(TokenTemplate)
		expect(tokens[ 6].position).toBe(TemplatePosition.HEAD)
		expect(tokens[ 6].source).toBe(`'''head1 {{`)
		expect(tokens[12]).toBeInstanceOf(TokenTemplate)
		expect(tokens[12].position).toBe(TemplatePosition.HEAD)
		expect(tokens[12].source).toBe(`'''head2 {{`)
		expect(tokens[20]).toBeInstanceOf(TokenTemplate)
		expect(tokens[20].position).toBe(TemplatePosition.TAIL)
		expect(tokens[20].source).toBe(`}} tail2'''`)
		expect(tokens[26]).toBeInstanceOf(TokenTemplate)
		expect(tokens[26].position).toBe(TemplatePosition.TAIL)
		expect(tokens[26].source).toBe(`}} tail1'''`)
	})

	test('Non-escaped characters.', () => {
		const tokentemplate = [...new Lexer(`
'''0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7''';
		`.trim()).generate()][2]
		expect(tokentemplate.source.slice( 5,  7)).toBe(`\\'`)
		expect(tokentemplate.source.slice(10, 12)).toBe(`\\\\`)
		expect(tokentemplate.source.slice(15, 17)).toBe(`\\s`)
		expect(tokentemplate.source.slice(20, 22)).toBe(`\\t`)
		expect(tokentemplate.source.slice(25, 27)).toBe(`\\n`)
		expect(tokentemplate.source.slice(30, 32)).toBe(`\\r`)
		expect(tokentemplate.source.slice(35, 38)).toBe(`\\\\\``)
	})

	test('Non-escaped character sequences.', () => {
		const tokentemplate = [...new Lexer(`
'''0 \\u{24} 1 \\u{005f} 2 \\u{} 3''';
		`.trim()).generate()][2]
		expect(tokentemplate.source.slice( 5, 11)).toBe(`\\u{24}`)
		expect(tokentemplate.source.slice(14, 22)).toBe(`\\u{005f}`)
		expect(tokentemplate.source.slice(25, 29)).toBe(`\\u{}`)
	})

	test('Line breaks.', () => {
		const tokentemplate = [...new Lexer(`
'''012\\
345
678''';
		`.trim()).generate()][2]
		expect(tokentemplate.source.slice( 6,  8)).toBe(`\\\n`)
		expect(tokentemplate.source.slice(11, 12)).toBe(`\n`)
	})

	test('Unfinished template throws.', () => {
		;[`
'''template without end delimiter
		`, `
'''template with end delimiter but contains \u0003 character'''
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})

	test('Invalid characters at end of template.', () => {
		;[`
'''template-head that ends with a single open brace {{{
		`, `
}}template-middle that ends with a single open brace {{{
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError01)
		})
		;[`
'''template-full that ends with a single apostrophe ''''
		`, `
}}template-tail that ends with a single apostrophe ''''
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			expect(() => [...lexer.generate()]).toThrow(LexError02)
		})
	})
})



test('Screener computes `TokenTemplate` values.', () => {
	const tokens = [...new Screener(`
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
	`.trim()).generate()]
	expect(tokens[ 3].cook()).toBe(``)
	expect(tokens[ 7].cook()).toBe(`hello`)
	expect(tokens[13].cook()).toBe(`head`)
	expect(tokens[18].cook()).toBe(`midl`)
	expect(tokens[23].cook()).toBe(`tail`)
	expect(tokens[26].cook()).toBe(`0 \\\` 1`)
	expect(tokens[28].cook()).toBe(`0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7`)
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
'''head1{{}}tail1''';
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ }}tail1&apos;&apos;&apos;">
	<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
	<TEMPLATE line="1" col="11" value="tail1">}}tail1'''</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}tail1''';
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
	<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
	<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
			<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
				<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
					<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
						<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<TEMPLATE line="1" col="24" value="tail1">}}tail1'''</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{}}tail1''';
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ }}tail1&apos;&apos;&apos;">
	<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
	<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
			<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
				<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
					<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
						<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<StringTemplate__0__List line="1" col="24" source="}}midd1{{">
		<TEMPLATE line="1" col="24" value="midd1">}}midd1{{</TEMPLATE>
	</StringTemplate__0__List>
	<TEMPLATE line="1" col="33" value="tail1">}}tail1'''</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
	<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
	<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
			<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
				<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
					<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
						<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos;">
		<TEMPLATE line="1" col="24" value="midd1">}}midd1{{</TEMPLATE>
		<Expression line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
			<ExpressionAdditive line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
				<ExpressionMultiplicative line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
					<ExpressionExponential line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
						<ExpressionUnarySymbol line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
							<ExpressionUnit line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
								<StringTemplate line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
									<TEMPLATE line="1" col="34" value="full2">'''full2'''</TEMPLATE>
								</StringTemplate>
							</ExpressionUnit>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionMultiplicative>
			</ExpressionAdditive>
		</Expression>
	</StringTemplate__0__List>
	<TEMPLATE line="1" col="46" value="tail1">}}tail1'''</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, middle, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ }}tail1&apos;&apos;&apos;">
	<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
	<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
			<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
				<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
					<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
						<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{">
		<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos;">
			<TEMPLATE line="1" col="24" value="midd1">}}midd1{{</TEMPLATE>
			<Expression line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
				<ExpressionAdditive line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
					<ExpressionMultiplicative line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
						<ExpressionExponential line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
							<ExpressionUnarySymbol line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
								<ExpressionUnit line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
									<StringTemplate line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
										<TEMPLATE line="1" col="34" value="full2">'''full2'''</TEMPLATE>
									</StringTemplate>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
		</StringTemplate__0__List>
		<TEMPLATE line="1" col="46" value="midd2">}}midd2{{</TEMPLATE>
	</StringTemplate__0__List>
	<TEMPLATE line="1" col="55" value="tail1">}}tail1'''</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, middle, expr, tail.', () => {
		expect(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
		`.trim()).parse()).serialize()).toBe(`
<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ &apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
	<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
	<Expression line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<ExpressionAdditive line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
			<ExpressionMultiplicative line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
				<ExpressionExponential line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
					<ExpressionUnarySymbol line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
						<ExpressionUnit line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
							<StringTemplate line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
								<TEMPLATE line="1" col="12" value="full1">'''full1'''</TEMPLATE>
							</StringTemplate>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ &apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
		<StringTemplate__0__List line="1" col="24" source="}}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos;">
			<TEMPLATE line="1" col="24" value="midd1">}}midd1{{</TEMPLATE>
			<Expression line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
				<ExpressionAdditive line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
					<ExpressionMultiplicative line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
						<ExpressionExponential line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
							<ExpressionUnarySymbol line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
								<ExpressionUnit line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
									<StringTemplate line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
										<TEMPLATE line="1" col="34" value="full2">'''full2'''</TEMPLATE>
									</StringTemplate>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
		</StringTemplate__0__List>
		<TEMPLATE line="1" col="46" value="midd2">}}midd2{{</TEMPLATE>
		<Expression line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
			<ExpressionAdditive line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
				<ExpressionMultiplicative line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
					<ExpressionExponential line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
						<ExpressionUnarySymbol line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
							<ExpressionUnit line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
								<StringTemplate line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
									<TEMPLATE line="1" col="56" value="head2">'''head2{{</TEMPLATE>
									<Expression line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
										<ExpressionAdditive line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
											<ExpressionMultiplicative line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
												<ExpressionExponential line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
													<ExpressionUnarySymbol line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
														<ExpressionUnit line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
															<StringTemplate line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
																<TEMPLATE line="1" col="67" value="full3">'''full3'''</TEMPLATE>
															</StringTemplate>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionExponential>
											</ExpressionMultiplicative>
										</ExpressionAdditive>
									</Expression>
									<TEMPLATE line="1" col="79" value="tail2">}}tail2'''</TEMPLATE>
								</StringTemplate>
							</ExpressionUnit>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionMultiplicative>
			</ExpressionAdditive>
		</Expression>
	</StringTemplate__0__List>
	<TEMPLATE line="1" col="90" value="tail1">}}tail1'''</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Orphaned head throws.', () => {
		expect(() => new Parser(`
'''A string template head token not followed by a middle or tail {{ 1;
		`.trim()).parse()).toThrow('Unexpected token')
	})

	test('Orphaned middle throws.', () => {
		expect(() => new Parser(`
2 }} a string template middle token not preceded by a head/middle and not followed by a middle/tail {{ 3;
		`.trim()).parse()).toThrow('Unexpected token')
	})

	test('Orphaned tail throws.', () => {
		expect(() => new Parser(`
4 }} a string template tail token not preceded by a head or middle''';
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
'''head1{{}}tail1''';
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ }}tail1&apos;&apos;&apos;">
	<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
	<Constant line="1" col="11" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}tail1''';
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
	<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
	<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
	</Template>
	<Constant line="1" col="24" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{}}tail1''';
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ }}tail1&apos;&apos;&apos;">
	<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
	<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
	</Template>
	<Constant line="1" col="24" source="}}midd1{{" value="midd1"/>
	<Constant line="1" col="33" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
	<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
	<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
	</Template>
	<Constant line="1" col="24" source="}}midd1{{" value="midd1"/>
	<Template line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
		<Constant line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;" value="full2"/>
	</Template>
	<Constant line="1" col="46" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, middle, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ }}tail1&apos;&apos;&apos;">
	<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
	<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
	</Template>
	<Constant line="1" col="24" source="}}midd1{{" value="midd1"/>
	<Template line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
		<Constant line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;" value="full2"/>
	</Template>
	<Constant line="1" col="46" source="}}midd2{{" value="midd2"/>
	<Constant line="1" col="55" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, middle, expr, middle, expr, tail.', () => {
		expect(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
		`.trim()).parse().decorate()).serialize()).toBe(`
<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ &apos;&apos;&apos;full1&apos;&apos;&apos; }}midd1{{ &apos;&apos;&apos;full2&apos;&apos;&apos; }}midd2{{ &apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos; }}tail1&apos;&apos;&apos;">
	<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
	<Template line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;">
		<Constant line="1" col="12" source="&apos;&apos;&apos;full1&apos;&apos;&apos;" value="full1"/>
	</Template>
	<Constant line="1" col="24" source="}}midd1{{" value="midd1"/>
	<Template line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;">
		<Constant line="1" col="34" source="&apos;&apos;&apos;full2&apos;&apos;&apos;" value="full2"/>
	</Template>
	<Constant line="1" col="46" source="}}midd2{{" value="midd2"/>
	<Template line="1" col="56" source="&apos;&apos;&apos;head2{{ &apos;&apos;&apos;full3&apos;&apos;&apos; }}tail2&apos;&apos;&apos;">
		<Constant line="1" col="56" source="&apos;&apos;&apos;head2{{" value="head2"/>
		<Template line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;">
			<Constant line="1" col="67" source="&apos;&apos;&apos;full3&apos;&apos;&apos;" value="full3"/>
		</Template>
		<Constant line="1" col="79" source="}}tail2&apos;&apos;&apos;" value="tail2"/>
	</Template>
	<Constant line="1" col="90" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})
})
