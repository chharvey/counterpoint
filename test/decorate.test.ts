import * as assert from 'assert'

import Parser from '../src/class/Parser.class'



test('Decorate empty file.', () => {
	const node = new Parser('').parse()
	assert.strictEqual(node.decorate().tagname, 'Null')
})



test.skip('Decorate file with single token.', () => {
	const node = new Parser('42').parse()
	assert.strictEqual(node.decorate().serialize(), `
<Goal source=\"␂ 42 ␃\">
	<Constant line="1" col="1" source="42" value="42"/>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate unary symbol.', () => {
	const node = new Parser('- 42').parse().children[1]
	assert.strictEqual(node.decorate().serialize(), `
<Expression line="1" col="1" source="- 42" operator="-">
	<Constant line="1" col="3" source="42" value="42"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate exponential.', () => {
	const node = new Parser('2 ^ -3').parse().children[1]
	assert.strictEqual(node.decorate().serialize(), `
<Expression line="1" col="1" source="2 ^ -3" operator="^">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate multiplicative.', () => {
	const node = new Parser('2 * -3').parse().children[1]
	assert.strictEqual(node.decorate().serialize(), `
<Expression line="1" col="1" source="2 * -3" operator="*">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate additive.', () => {
	const node = new Parser('2 + -3').parse().children[1]
	assert.strictEqual(node.decorate().serialize(), `
<Expression line="1" col="1" source="2 + -3" operator="+">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate subtractive.', () => {
	const node = new Parser('2 - 3').parse().children[1]
	assert.strictEqual(node.decorate().serialize(), `
<Expression line="1" col="1" source="2 - 3" operator="+">
	<Constant line="1" col="1" source="2" value="2"/>
	<Expression line="1" col="5" source="3" operator="-">
		<Constant line="1" col="5" source="3" value="3"/>
	</Expression>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate grouping.', () => {
	const node = new Parser('(2 + -3)').parse().children[1]
	assert.strictEqual(node.decorate().serialize(), `
<Expression line="1" col="2" source="2 + -3" operator="+">
	<Constant line="1" col="2" source="2" value="2"/>
	<Constant line="1" col="6" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})
