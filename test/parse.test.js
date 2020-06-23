const {TokenFilebound} = require('../build/class/Token.class.js')
const {default: Parser} = require('../build/class/Parser.class.js')

const mock = `
5  +  30

+ 6 ^ - (2 - 37 *

3 - 50 + - 2

- 5 + 03) *  -2 *

600  /  3  *  2

/ 600  /  (3  *  2) ^

4 * 2 ^ 3

- 60 * -2 / 12 +

 4 * 222 ^ 3
`.trim()



test('Parse empty file.', () => {
	const tree = new Parser('').parse()
	expect(tree.tagname).toBe('File')
	expect(tree.children.length).toBe(2)
	tree.children.forEach((child) => expect(child).toEqual(expect.any(TokenFilebound)))
})



test('Parse simple expression unit.', () => {
	const tree = new Parser('42').parse()
	expect(tree.serialize()).toBe(`
<File source="␂ 42 ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
		<Expression line="1" col="1" source="42">
			<ExpressionAdditive line="1" col="1" source="42">
				<ExpressionMultiplicative line="1" col="1" source="42">
					<ExpressionExponential line="1" col="1" source="42">
						<ExpressionUnarySymbol line="1" col="1" source="42">
							<ExpressionUnit line="1" col="1" source="42">
								<NUMBER line="1" col="1" value="42">42</NUMBER>
							</ExpressionUnit>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionMultiplicative>
			</ExpressionAdditive>
		</Expression>
	<FILEBOUND value="false">␃</FILEBOUND>
</File>
	`.replace(/\n\t*/g, ''))
})



test('Parse unary symbol.', () => {
	const tree = new Parser('- 42').parse()
	expect(tree.serialize()).toBe(`
<File source="␂ - 42 ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
		<Expression line="1" col="1" source="- 42">
			<ExpressionAdditive line="1" col="1" source="- 42">
				<ExpressionMultiplicative line="1" col="1" source="- 42">
					<ExpressionExponential line="1" col="1" source="- 42">
						<ExpressionUnarySymbol line="1" col="1" source="- 42">
							<PUNCTUATOR line="1" col="1">-</PUNCTUATOR>
							<ExpressionUnarySymbol line="1" col="3" source="42">
								<ExpressionUnit line="1" col="3" source="42">
									<NUMBER line="1" col="3" value="42">42</NUMBER>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionMultiplicative>
			</ExpressionAdditive>
		</Expression>
	<FILEBOUND value="false">␃</FILEBOUND>
</File>
	`.replace(/\n\t*/g, ''))
})



test('Parse unary on negative number literal.', () => {
	expect(new Parser('--2').parse().serialize()).toBe(`
		<File source=\"␂ - -2 ␃\">
			<FILEBOUND value=\"true\">␂</FILEBOUND>
			<Expression line=\"1\" col=\"1\" source=\"- -2\">
				<ExpressionAdditive line=\"1\" col=\"1\" source=\"- -2\">
					<ExpressionMultiplicative line=\"1\" col=\"1\" source=\"- -2\">
						<ExpressionExponential line=\"1\" col=\"1\" source=\"- -2\">
							<ExpressionUnarySymbol line=\"1\" col=\"1\" source=\"- -2\">
								<PUNCTUATOR line=\"1\" col=\"1\">-</PUNCTUATOR>
								<ExpressionUnarySymbol line=\"1\" col=\"2\" source=\"-2\">
									<ExpressionUnit line=\"1\" col=\"2\" source=\"-2\">
										<NUMBER line=\"1\" col=\"2\" value=\"-2\">-2</NUMBER>
									</ExpressionUnit>
								</ExpressionUnarySymbol>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
			<FILEBOUND value=\"false\">␃</FILEBOUND>
		</File>
	`.replace(/\n\t*/g, ''))
})



test('Parse exponential.', () => {
	const tree = new Parser('2 ^ -3').parse()
	expect(tree.serialize()).toBe(`
<File source="␂ 2 ^ -3 ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Expression line="1" col="1" source="2 ^ -3">
		<ExpressionAdditive line="1" col="1" source="2 ^ -3">
			<ExpressionMultiplicative line="1" col="1" source="2 ^ -3">
				<ExpressionExponential line="1" col="1" source="2 ^ -3">
					<ExpressionUnarySymbol line="1" col="1" source="2">
						<ExpressionUnit line="1" col="1" source="2">
							<NUMBER line="1" col="1" value="2">2</NUMBER>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
					<PUNCTUATOR line="1" col="3">^</PUNCTUATOR>
					<ExpressionExponential line="1" col="5" source="-3">
						<ExpressionUnarySymbol line="1" col="5" source="-3">
							<ExpressionUnit line="1" col="5" source="-3">
								<NUMBER line="1" col="5" value="-3">-3</NUMBER>
							</ExpressionUnit>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<FILEBOUND value="false">␃</FILEBOUND>
</File>
	`.replace(/\n\t*/g, ''))
})



test('Parse multiplicative.', () => {
	const tree = new Parser('2 * -3').parse()
	expect(tree.serialize()).toBe(`
<File source="␂ 2 * -3 ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Expression line="1" col="1" source="2 * -3">
		<ExpressionAdditive line="1" col="1" source="2 * -3">
			<ExpressionMultiplicative line="1" col="1" source="2 * -3">
				<ExpressionMultiplicative line="1" col="1" source="2">
					<ExpressionExponential line="1" col="1" source="2">
						<ExpressionUnarySymbol line="1" col="1" source="2">
							<ExpressionUnit line="1" col="1" source="2">
								<NUMBER line="1" col="1" value="2">2</NUMBER>
							</ExpressionUnit>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionMultiplicative>
				<PUNCTUATOR line="1" col="3">*</PUNCTUATOR>
				<ExpressionExponential line="1" col="5" source="-3">
					<ExpressionUnarySymbol line="1" col="5" source="-3">
						<ExpressionUnit line="1" col="5" source="-3">
							<NUMBER line="1" col="5" value="-3">-3</NUMBER>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<FILEBOUND value="false">␃</FILEBOUND>
</File>
	`.replace(/\n\t*/g, ''))
})



test('Parse additive.', () => {
	const tree = new Parser('2 + -3').parse()
	expect(tree.serialize()).toBe(`
<File source="␂ 2 + -3 ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Expression line="1" col="1" source="2 + -3">
		<ExpressionAdditive line="1" col="1" source="2 + -3">
			<ExpressionAdditive line="1" col="1" source="2">
				<ExpressionMultiplicative line="1" col="1" source="2">
					<ExpressionExponential line="1" col="1" source="2">
						<ExpressionUnarySymbol line="1" col="1" source="2">
							<ExpressionUnit line="1" col="1" source="2">
								<NUMBER line="1" col="1" value="2">2</NUMBER>
							</ExpressionUnit>
						</ExpressionUnarySymbol>
					</ExpressionExponential>
				</ExpressionMultiplicative>
			</ExpressionAdditive>
			<PUNCTUATOR line="1" col="3">+</PUNCTUATOR>
			<ExpressionMultiplicative line="1" col="5" source="-3">
				<ExpressionExponential line="1" col="5" source="-3">
					<ExpressionUnarySymbol line="1" col="5" source="-3">
						<ExpressionUnit line="1" col="5" source="-3">
							<NUMBER line="1" col="5" value="-3">-3</NUMBER>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<FILEBOUND value="false">␃</FILEBOUND>
</File>
	`.replace(/\n\t*/g, ''))
})



test('Parse grouping.', () => {
	const tree = new Parser('(2 + -3)').parse()
	expect(tree.serialize()).toBe(`
<File source="␂ ( 2 + -3 ) ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Expression line="1" col="1" source="( 2 + -3 )">
		<ExpressionAdditive line="1" col="1" source="( 2 + -3 )">
			<ExpressionMultiplicative line="1" col="1" source="( 2 + -3 )">
				<ExpressionExponential line="1" col="1" source="( 2 + -3 )">
					<ExpressionUnarySymbol line="1" col="1" source="( 2 + -3 )">
						<ExpressionUnit line="1" col="1" source="( 2 + -3 )">
							<PUNCTUATOR line="1" col="1">(</PUNCTUATOR>
							<Expression line="1" col="2" source="2 + -3">
								<ExpressionAdditive line="1" col="2" source="2 + -3">
									<ExpressionAdditive line="1" col="2" source="2">
										<ExpressionMultiplicative line="1" col="2" source="2">
											<ExpressionExponential line="1" col="2" source="2">
												<ExpressionUnarySymbol line="1" col="2" source="2">
													<ExpressionUnit line="1" col="2" source="2">
														<NUMBER line="1" col="2" value="2">2</NUMBER>
													</ExpressionUnit>
												</ExpressionUnarySymbol>
											</ExpressionExponential>
										</ExpressionMultiplicative>
									</ExpressionAdditive>
									<PUNCTUATOR line="1" col="4">+</PUNCTUATOR>
									<ExpressionMultiplicative line="1" col="6" source="-3">
										<ExpressionExponential line="1" col="6" source="-3">
											<ExpressionUnarySymbol line="1" col="6" source="-3">
												<ExpressionUnit line="1" col="6" source="-3">
													<NUMBER line="1" col="6" value="-3">-3</NUMBER>
												</ExpressionUnit>
											</ExpressionUnarySymbol>
										</ExpressionExponential>
									</ExpressionMultiplicative>
								</ExpressionAdditive>
							</Expression>
							<PUNCTUATOR line="1" col="8">)</PUNCTUATOR>
						</ExpressionUnit>
					</ExpressionUnarySymbol>
				</ExpressionExponential>
			</ExpressionMultiplicative>
		</ExpressionAdditive>
	</Expression>
	<FILEBOUND value="false">␃</FILEBOUND>
</File>
	`.replace(/\n\t*/g, ''))
})



test('Parse full.', () => {
	expect(() => {
		const tree = new Parser(mock).parse()
	}).not.toThrow()
})



test('Parse Errors', () => {
	expect(() => {
		const tree = new Parser('2 3').parse()
	}).toThrow('Unexpected token')
})
