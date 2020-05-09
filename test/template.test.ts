import * as assert from 'assert'

import Parser   from '../src/class/Parser.class'
import type {
	SemanticNodeTemplate,
} from '../src/class/SemanticNode.class'



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
