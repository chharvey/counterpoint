const {default: Parser} = require('../build/class/Parser.class.js')



test('Decorate empty file.', () => {
	const node = new Parser('').parse()
	expect(node.decorate().tagname).toBe('Null')
})



test('Decorate file with single token.', () => {
	const trees = ['42', '+42', '-42'].map((src) => new Parser(src).parse().decorate().serialize())
	expect(trees).toEqual([`
		<Goal source=\"␂ 42 ␃\">
			<Constant line="1" col="1" source="42" value="42"/>
		</Goal>
	`, `
		<Goal source=\"␂ +42 ␃\">
			<Constant line="1" col="1" source="+42" value="42"/>
		</Goal>
	`, `
		<Goal source=\"␂ -42 ␃\">
			<Constant line="1" col="1" source="-42" value="-42"/>
		</Goal>
	`].map((out) => out.replace(/\n\t*/g, '')))
})



test('Decorate unary symbol, affirm.', () => {
	const node = new Parser('+ 42').parse().children[1]
	expect(node.decorate().serialize()).toBe(`
		<Expression line="1" col="1" source="+ 42" operator="AFF">
			<Constant line="1" col="3" source="42" value="42"/>
		</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate unary symbol, negate.', () => {
	const node = new Parser('- 42').parse().children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="- 42" operator="NEG">
	<Constant line="1" col="3" source="42" value="42"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate exponential.', () => {
	const node = new Parser('2 ^ -3').parse().children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="2 ^ -3" operator="EXP">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate multiplicative.', () => {
	const node = new Parser('2 * -3').parse().children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="2 * -3" operator="MUL">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate additive.', () => {
	const node = new Parser('2 + -3').parse().children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="2 + -3" operator="ADD">
	<Constant line="1" col="1" source="2" value="2"/>
	<Constant line="1" col="5" source="-3" value="-3"/>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate subtractive.', () => {
	const node = new Parser('2 - 3').parse().children[1]
	expect(node.decorate().serialize()).toBe(`
<Expression line="1" col="1" source="2 - 3" operator="ADD">
	<Constant line="1" col="1" source="2" value="2"/>
	<Expression line="1" col="5" source="3" operator="NEG">
		<Constant line="1" col="5" source="3" value="3"/>
	</Expression>
</Expression>
	`.replace(/\n\t*/g, ''))
})



test('Decorate grouping.', () => {
	const node = new Parser('-(42) ^ +(2 * 420)').parse().children[1]
	expect(node.decorate().serialize()).toBe(`
		<Expression line="1" col="1" source="- ( 42 ) ^ + ( 2 * 420 )" operator="EXP">
			<Expression line="1" col="1" source="- ( 42 )" operator="NEG">
				<Constant line="1" col="3" source="42" value="42"/>
			</Expression>
			<Expression line="1" col="9" source="+ ( 2 * 420 )" operator="AFF">
				<Expression line="1" col="11" source="2 * 420" operator="MUL">
					<Constant line="1" col="11" source="2" value="2"/>
					<Constant line="1" col="15" source="420" value="420"/>
				</Expression>
			</Expression>
		</Expression>
	`.replace(/\n\t*/g, ''))
})
