const {default: Parser} = require('../build/class/Parser.class.js')



describe('Empty statements.', () => {
	test('Parse empty statement.', () => {
		const parser = new Parser(';')
		expect(parser.parse().serialize()).toBe(`
<Goal source="␂ ; ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Goal__0__List line="1" col="1" source=";">
		<Statement line="1" col="1" source=";">
			<PUNCTUATOR line="1" col="1" value=";">;</PUNCTUATOR>
		</Statement>
	</Goal__0__List>
	<FILEBOUND value="false">␃</FILEBOUND>
</Goal>
		`.replace(/\n\t*/g, ''))
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

	test('Compile empty statement.', () => {
		const parser = new Parser(';')
		expect(parser.parse().decorate().compile()).toBe(`
export default void 0
export default __2
		`.trim())
	})
})



test('Parse Errors', () => {
	expect(() => {
		const tree = new Parser('2 3').parse()
	}).toThrow('Unexpected token')
})
