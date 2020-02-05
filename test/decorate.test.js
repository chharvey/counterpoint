const {default: Parser} = require('../build/class/Parser.class.js')



test('Decorate empty file.', () => {
	const node = new Parser('').parse()
	expect(node.decorate().tagname).toBe('Null')
})



test('Decorate empty statement.', () => {
	const parser = new Parser(';')
	expect(parser.parse().decorate().serialize()).toBe(`
<Goal source="␂ ; ␃">
	<StatementList line="1" col="1" source=";">
		<Statement line="1" col="1" source=";" type="expression"/>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Decorate expression unit.', () => {
	const node = new Parser('42;').parse()
	expect(node.decorate().serialize()).toBe(`
<Goal source="␂ 42 ; ␃">
	<StatementList line="1" col="1" source="42 ;">
		<Statement line="1" col="1" source="42 ;" type="expression">
			<Constant line="1" col="1" source="42" value="42"/>
		</Statement>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Decorate unary symbol.', () => {
	const node = new Parser('- 42;').parse()
	expect(node.decorate().serialize()).toBe(`
<Goal source="␂ - 42 ; ␃">
	<StatementList line="1" col="1" source="- 42 ;">
		<Statement line="1" col="1" source="- 42 ;" type="expression">
			<Expression line="1" col="1" source="- 42" operator="-">
				<Constant line="1" col="3" source="42" value="42"/>
			</Expression>
		</Statement>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Decorate exponential.', () => {
	const node = new Parser('2 ^ -3;').parse()
	expect(node.decorate().serialize()).toBe(`
<Goal source="␂ 2 ^ -3 ; ␃">
	<StatementList line="1" col="1" source="2 ^ -3 ;">
		<Statement line="1" col="1" source="2 ^ -3 ;" type="expression">
			<Expression line="1" col="1" source="2 ^ -3" operator="^">
				<Constant line="1" col="1" source="2" value="2"/>
				<Constant line="1" col="5" source="-3" value="-3"/>
			</Expression>
		</Statement>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Decorate grouping.', () => {
	const node = new Parser('(2 + -3);').parse()
	expect(node.decorate().serialize()).toBe(`
<Goal source="␂ ( 2 + -3 ) ; ␃">
	<StatementList line="1" col="1" source="( 2 + -3 ) ;">
		<Statement line="1" col="1" source="( 2 + -3 ) ;" type="expression">
			<Expression line="1" col="2" source="2 + -3" operator="+">
				<Constant line="1" col="2" source="2" value="2"/>
				<Constant line="1" col="6" source="-3" value="-3"/>
			</Expression>
		</Statement>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})
