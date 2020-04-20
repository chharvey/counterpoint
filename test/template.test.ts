import * as assert from 'assert'

import Lexer    from '../src/class/Lexer.class'
import Screener from '../src/class/Screener.class'
import Parser   from '../src/class/Parser.class'
import Token, {
	TokenTemplate,
	TemplatePosition,
} from '../src/class/Token.class'
import type {
	ParseNodeStringTemplate,
} from '../src/class/ParseNode.class'
import type {
	SemanticNodeTemplate,
} from '../src/class/SemanticNode.class'
import {
	LexError01,
	LexError02,
} from '../src/error/LexError.class'



suite('Lexer recognizes `TokenTemplate` conditions.', () => {
	test('Basic templates.', () => {
		const tokens: Token[] = [...new Lexer(`
600  /  '''''' * 3 + '''hello''' *  2
		`.trim()).generate()]
		assert.ok(tokens[ 6] instanceof TokenTemplate)
		assert.strictEqual(tokens[ 6].position, TemplatePosition.FULL)
		assert.strictEqual(tokens[ 6].source.length, 6)
		assert.ok(tokens[14] instanceof TokenTemplate)
		assert.strictEqual(tokens[14].position, TemplatePosition.FULL)
		assert.strictEqual(tokens[14].source, `'''hello'''`)
	})

	test('Template interpolation.', () => {
		const tokens: Token[] = [...new Lexer(`
3 + '''head{{ * 2
3 + }}midl{{ * 2
3 + }}tail''' * 2
		`.trim()).generate()]
		assert.ok(tokens[ 6] instanceof TokenTemplate)
		assert.strictEqual(tokens[ 6].position, TemplatePosition.HEAD)
		assert.strictEqual(tokens[ 6].source, `'''head{{`)
		assert.ok(tokens[16] instanceof TokenTemplate)
		assert.strictEqual(tokens[16].position, TemplatePosition.MIDDLE)
		assert.strictEqual(tokens[16].source, `}}midl{{`)
		assert.ok(tokens[26] instanceof TokenTemplate)
		assert.strictEqual(tokens[26].position, TemplatePosition.TAIL)
		assert.strictEqual(tokens[26].source, `}}tail'''`)
	})

	test('Empty/comment interpolation.', () => {
		const tokens: Token[] = [...new Lexer(`
'''abc{{ }}def'''
'''ghi{{}}jkl'''
'''mno{{ {% pqr %} }}stu'''
		`.trim()).generate()]
		assert.ok(tokens[ 2] instanceof TokenTemplate)
		assert.strictEqual(tokens[ 2].position, TemplatePosition.HEAD)
		assert.strictEqual(tokens[ 2].source, `'''abc{{`)
		assert.ok(tokens[ 4] instanceof TokenTemplate)
		assert.strictEqual(tokens[ 4].position, TemplatePosition.TAIL)
		assert.strictEqual(tokens[ 4].source, `}}def'''`)
		assert.ok(tokens[ 6] instanceof TokenTemplate)
		assert.strictEqual(tokens[ 6].position, TemplatePosition.HEAD)
		assert.strictEqual(tokens[ 6].source, `'''ghi{{`)
		assert.ok(tokens[ 7] instanceof TokenTemplate)
		assert.strictEqual(tokens[ 7].position, TemplatePosition.TAIL)
		assert.strictEqual(tokens[ 7].source, `}}jkl'''`)
		assert.ok(tokens[ 9] instanceof TokenTemplate)
		assert.strictEqual(tokens[ 9].position, TemplatePosition.HEAD)
		assert.strictEqual(tokens[ 9].source, `'''mno{{`)
		assert.ok(tokens[13] instanceof TokenTemplate)
		assert.strictEqual(tokens[13].position, TemplatePosition.TAIL)
		assert.strictEqual(tokens[13].source, `}}stu'''`)
	})

	test('Nested interpolation.', () => {
		const tokens: Token[] = [...new Lexer(`
1 + '''head1 {{ 2 + '''head2 {{ 3 ^ 3 }} tail2''' * 2 }} tail1''' * 1
		`.trim()).generate()]
		assert.ok(tokens[ 6] instanceof TokenTemplate)
		assert.strictEqual(tokens[ 6].position, TemplatePosition.HEAD)
		assert.strictEqual(tokens[ 6].source, `'''head1 {{`)
		assert.ok(tokens[12] instanceof TokenTemplate)
		assert.strictEqual(tokens[12].position, TemplatePosition.HEAD)
		assert.strictEqual(tokens[12].source, `'''head2 {{`)
		assert.ok(tokens[20] instanceof TokenTemplate)
		assert.strictEqual(tokens[20].position, TemplatePosition.TAIL)
		assert.strictEqual(tokens[20].source, `}} tail2'''`)
		assert.ok(tokens[26] instanceof TokenTemplate)
		assert.strictEqual(tokens[26].position, TemplatePosition.TAIL)
		assert.strictEqual(tokens[26].source, `}} tail1'''`)
	})

	test('Non-escaped characters.', () => {
		const tokentemplate: Token = [...new Lexer(`
'''0 \\' 1 \\\\ 2 \\s 3 \\t 4 \\n 5 \\r 6 \\\\\` 7''';
		`.trim()).generate()][2]
		assert.strictEqual(tokentemplate.source.slice( 5,  7), `\\'`)
		assert.strictEqual(tokentemplate.source.slice(10, 12), `\\\\`)
		assert.strictEqual(tokentemplate.source.slice(15, 17), `\\s`)
		assert.strictEqual(tokentemplate.source.slice(20, 22), `\\t`)
		assert.strictEqual(tokentemplate.source.slice(25, 27), `\\n`)
		assert.strictEqual(tokentemplate.source.slice(30, 32), `\\r`)
		assert.strictEqual(tokentemplate.source.slice(35, 38), `\\\\\``)
	})

	test('Non-escaped character sequences.', () => {
		const tokentemplate: Token = [...new Lexer(`
'''0 \\u{24} 1 \\u{005f} 2 \\u{} 3''';
		`.trim()).generate()][2]
		assert.strictEqual(tokentemplate.source.slice( 5, 11), `\\u{24}`)
		assert.strictEqual(tokentemplate.source.slice(14, 22), `\\u{005f}`)
		assert.strictEqual(tokentemplate.source.slice(25, 29), `\\u{}`)
	})

	test('Line breaks.', () => {
		const tokentemplate: Token = [...new Lexer(`
'''012\\
345
678''';
		`.trim()).generate()][2]
		assert.strictEqual(tokentemplate.source.slice( 6,  8), `\\\n`)
		assert.strictEqual(tokentemplate.source.slice(11, 12), `\n`)
	})

	test('Unfinished template throws.', () => {
		;[`
'''template without end delimiter
		`, `
'''template with end delimiter but contains \u0003 character'''
8;
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			assert.throws(() => [...lexer.generate()], LexError02)
		})
	})

	test('Invalid characters at end of template.', () => {
		;[`
'''template-head that ends with a single open brace {{{
		`, `
}}template-middle that ends with a single open brace {{{
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			assert.throws(() => [...lexer.generate()], LexError01)
		})
		;[`
'''template-full that ends with a single apostrophe ''''
		`, `
}}template-tail that ends with a single apostrophe ''''
		`].map((source) => new Lexer(source.trim())).forEach((lexer) => {
			assert.throws(() => [...lexer.generate()], LexError02)
		})
	})
})



test('Screener computes `TokenTemplate` values.', () => {
	const tokens: Token[] = [...new Screener(`
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



suite('Parse `StringTemplate` expression units.', () => {
	const stringTemplateParseNode = (goal: any): ParseNodeStringTemplate => goal
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
		assert.strictEqual(stringTemplateParseNode(new Parser(`
'''head1{{}}tail1''';
		`.trim()).parse()).serialize(), `
<StringTemplate line="1" col="1" source="&apos;&apos;&apos;head1{{ }}tail1&apos;&apos;&apos;">
	<TEMPLATE line="1" col="1" value="head1">'''head1{{</TEMPLATE>
	<TEMPLATE line="1" col="11" value="tail1">}}tail1'''</TEMPLATE>
</StringTemplate>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, tail.', () => {
		assert.strictEqual(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}tail1''';
		`.trim()).parse()).serialize(), `
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
		assert.strictEqual(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{}}tail1''';
		`.trim()).parse()).serialize(), `
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
		assert.strictEqual(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
		`.trim()).parse()).serialize(), `
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
		assert.strictEqual(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
		`.trim()).parse()).serialize(), `
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
		assert.strictEqual(stringTemplateParseNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
		`.trim()).parse()).serialize(), `
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
		assert.throws(() => new Parser(`
'''A string template head token not followed by a middle or tail {{ 1;
		`.trim()).parse(), /Unexpected token/)
	})

	test('Orphaned middle throws.', () => {
		assert.throws(() => new Parser(`
2 }} a string template middle token not preceded by a head/middle and not followed by a middle/tail {{ 3;
		`.trim()).parse(), /Unexpected token/)
	})

	test('Orphaned tail throws.', () => {
		assert.throws(() => new Parser(`
4 }} a string template tail token not preceded by a head or middle''';
		`.trim()).parse(), /Unexpected token/)
	})
})



suite('Decorate `StringTemplate` expression units.', () => {
	const stringTemplateSemanticNode = (goal: any): SemanticNodeTemplate => goal
		.children[0] // StatementList
		.children[0] // Statement
		.children[0] // Template

	test('Head, tail.', () => {
		assert.strictEqual(stringTemplateSemanticNode(new Parser(`
'''head1{{}}tail1''';
		`.trim()).parse().decorate()).serialize(), `
<Template line="1" col="1" source="&apos;&apos;&apos;head1{{ }}tail1&apos;&apos;&apos;">
	<Constant line="1" col="1" source="&apos;&apos;&apos;head1{{" value="head1"/>
	<Constant line="1" col="11" source="}}tail1&apos;&apos;&apos;" value="tail1"/>
</Template>
		`.replace(/\n\t*/g, ''))
	})

	test('Head, expr, tail.', () => {
		assert.strictEqual(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}tail1''';
		`.trim()).parse().decorate()).serialize(), `
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
		assert.strictEqual(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{}}tail1''';
		`.trim()).parse().decorate()).serialize(), `
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
		assert.strictEqual(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}tail1''';
		`.trim()).parse().decorate()).serialize(), `
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
		assert.strictEqual(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{}}tail1''';
		`.trim()).parse().decorate()).serialize(), `
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
		assert.strictEqual(stringTemplateSemanticNode(new Parser(`
'''head1{{ '''full1''' }}midd1{{ '''full2''' }}midd2{{ '''head2{{ '''full3''' }}tail2''' }}tail1''';
		`.trim()).parse().decorate()).serialize(), `
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
