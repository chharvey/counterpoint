import * as assert from 'assert'

import Parser from '../src/class/Parser.class'



test('Decorate empty file.', () => {
	assert.strictEqual(new Parser('').parse().decorate().tagname, 'Null')
})



test.skip('Decorate file with single token.', () => {
	assert.strictEqual(new Parser('42').parse().decorate().serialize(), `
<Goal source=\"␂ 42 ␃\">
	<Constant line="1" col="1" source="42" value="42"/>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate unary symbol.', () => {
	assert.strictEqual(new Parser('- 42').parse().children[1].decorate().serialize(), `
<Expression line="1" col="1" source="- 42" operator="-">
	<Constant line="1" col="3" source="42" value="42"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate exponential.', () => {
	assert.strictEqual(new Parser('2 ^ -3').parse().children[1].decorate().serialize(), `
<Expression line="1" col="1" source="2 ^ -3" operator="^">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate multiplicative.', () => {
	assert.strictEqual(new Parser('2 * -3').parse().children[1].decorate().serialize(), `
<Expression line="1" col="1" source="2 * -3" operator="*">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate additive.', () => {
	assert.strictEqual(new Parser('2 + -3').parse().children[1].decorate().serialize(), `
<Expression line="1" col="1" source="2 + -3" operator="+">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate subtractive.', () => {
	assert.strictEqual(new Parser('2 - 3').parse().children[1].decorate().serialize(), `
<Expression line="1" col="1" source="2 - 3" operator="+">
	<Constant line="1" col="1" source="2" value="2"/>
	<Expression line="1" col="5" source="3" operator="-">
		<Constant line="1" col="5" source="3" value="3"/>
	</Expression>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test.skip('Decorate grouping.', () => {
	assert.strictEqual(new Parser('(2 + -3)').parse().children[1].decorate().serialize(), `
<Expression line="1" col="2" source="2 + -3" operator="+">
	<Constant line="1" col="2" source="2" value="2"/>
	<Constant line="1" col="6" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})
