import * as assert from 'assert'

import Parser   from '../src/class/Parser.class'
import type {
	ParseNodeStringTemplate,
} from '../src/class/ParseNode.class'
import type {
	SemanticNodeTemplate,
} from '../src/class/SemanticNode.class'



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
