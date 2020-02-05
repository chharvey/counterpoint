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

 4 * 222 ^ 3;
`.trim()



test('Parse empty file.', () => {
	const tree = new Parser('').parse()
	expect(tree.tagname).toBe('Goal')
	expect(tree.children.length).toBe(2)
	tree.children.forEach((child) => expect(child).toEqual(expect.any(TokenFilebound)))
})



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



test('Parse expression unit.', () => {
	const tree = new Parser('42;').parse()
	expect(tree.serialize()).toBe(`
<Goal source="␂ 42 ; ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Goal__0__List line="1" col="1" source="42 ;">
		<Statement line="1" col="1" source="42 ;">
			<Expression line="1" col="1" source="42">
				<ExpressionAdditive line="1" col="1" source="42">
					<ExpressionMultiplicative line="1" col="1" source="42">
						<ExpressionExponential line="1" col="1" source="42">
							<ExpressionUnarySymbol line="1" col="1" source="42">
								<ExpressionUnit line="1" col="1" source="42">
									<PrimitiveLiteral line="1" col="1" source="42">
										<NUMBER line="1" col="1" value="42">42</NUMBER>
									</PrimitiveLiteral>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
			<PUNCTUATOR line="1" col="3" value=";">;</PUNCTUATOR>
		</Statement>
	</Goal__0__List>
	<FILEBOUND value="false">␃</FILEBOUND>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Parse unary symbol.', () => {
	const tree = new Parser('- 42;').parse()
	expect(tree.serialize()).toBe(`
<Goal source="␂ - 42 ; ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Goal__0__List line="1" col="1" source="- 42 ;">
		<Statement line="1" col="1" source="- 42 ;">
			<Expression line="1" col="1" source="- 42">
				<ExpressionAdditive line="1" col="1" source="- 42">
					<ExpressionMultiplicative line="1" col="1" source="- 42">
						<ExpressionExponential line="1" col="1" source="- 42">
							<ExpressionUnarySymbol line="1" col="1" source="- 42">
								<PUNCTUATOR line="1" col="1" value="-">-</PUNCTUATOR>
								<ExpressionUnarySymbol line="1" col="3" source="42">
									<ExpressionUnit line="1" col="3" source="42">
										<PrimitiveLiteral line="1" col="3" source="42">
											<NUMBER line="1" col="3" value="42">42</NUMBER>
										</PrimitiveLiteral>
									</ExpressionUnit>
								</ExpressionUnarySymbol>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
			<PUNCTUATOR line="1" col="5" value=";">;</PUNCTUATOR>
		</Statement>
	</Goal__0__List>
	<FILEBOUND value="false">␃</FILEBOUND>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Parse exponential.', () => {
	const tree = new Parser('2 ^ -3;').parse()
	expect(tree.serialize()).toBe(`
<Goal source="␂ 2 ^ -3 ; ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Goal__0__List line="1" col="1" source="2 ^ -3 ;">
		<Statement line="1" col="1" source="2 ^ -3 ;">
			<Expression line="1" col="1" source="2 ^ -3">
				<ExpressionAdditive line="1" col="1" source="2 ^ -3">
					<ExpressionMultiplicative line="1" col="1" source="2 ^ -3">
						<ExpressionExponential line="1" col="1" source="2 ^ -3">
							<ExpressionUnarySymbol line="1" col="1" source="2">
								<ExpressionUnit line="1" col="1" source="2">
									<PrimitiveLiteral line="1" col="1" source="2">
										<NUMBER line="1" col="1" value="2">2</NUMBER>
									</PrimitiveLiteral>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
							<PUNCTUATOR line="1" col="3" value="^">^</PUNCTUATOR>
							<ExpressionExponential line="1" col="5" source="-3">
								<ExpressionUnarySymbol line="1" col="5" source="-3">
									<ExpressionUnit line="1" col="5" source="-3">
										<PrimitiveLiteral line="1" col="5" source="-3">
											<NUMBER line="1" col="5" value="-3">-3</NUMBER>
										</PrimitiveLiteral>
									</ExpressionUnit>
								</ExpressionUnarySymbol>
							</ExpressionExponential>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
			<PUNCTUATOR line="1" col="7" value=";">;</PUNCTUATOR>
		</Statement>
	</Goal__0__List>
	<FILEBOUND value="false">␃</FILEBOUND>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Parse multiplicative.', () => {
	const tree = new Parser('2 * -3;').parse()
	expect(tree.serialize()).toBe(`
<Goal source="␂ 2 * -3 ; ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Goal__0__List line="1" col="1" source="2 * -3 ;">
		<Statement line="1" col="1" source="2 * -3 ;">
			<Expression line="1" col="1" source="2 * -3">
				<ExpressionAdditive line="1" col="1" source="2 * -3">
					<ExpressionMultiplicative line="1" col="1" source="2 * -3">
						<ExpressionMultiplicative line="1" col="1" source="2">
							<ExpressionExponential line="1" col="1" source="2">
								<ExpressionUnarySymbol line="1" col="1" source="2">
									<ExpressionUnit line="1" col="1" source="2">
										<PrimitiveLiteral line="1" col="1" source="2">
											<NUMBER line="1" col="1" value="2">2</NUMBER>
										</PrimitiveLiteral>
									</ExpressionUnit>
								</ExpressionUnarySymbol>
							</ExpressionExponential>
						</ExpressionMultiplicative>
						<PUNCTUATOR line="1" col="3" value="*">*</PUNCTUATOR>
						<ExpressionExponential line="1" col="5" source="-3">
							<ExpressionUnarySymbol line="1" col="5" source="-3">
								<ExpressionUnit line="1" col="5" source="-3">
									<PrimitiveLiteral line="1" col="5" source="-3">
										<NUMBER line="1" col="5" value="-3">-3</NUMBER>
									</PrimitiveLiteral>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
			<PUNCTUATOR line="1" col="7" value=";">;</PUNCTUATOR>
		</Statement>
	</Goal__0__List>
	<FILEBOUND value="false">␃</FILEBOUND>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Parse additive.', () => {
	const tree = new Parser('2 + -3;').parse()
	expect(tree.serialize()).toBe(`
<Goal source="␂ 2 + -3 ; ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Goal__0__List line="1" col="1" source="2 + -3 ;">
		<Statement line="1" col="1" source="2 + -3 ;">
			<Expression line="1" col="1" source="2 + -3">
				<ExpressionAdditive line="1" col="1" source="2 + -3">
					<ExpressionAdditive line="1" col="1" source="2">
						<ExpressionMultiplicative line="1" col="1" source="2">
							<ExpressionExponential line="1" col="1" source="2">
								<ExpressionUnarySymbol line="1" col="1" source="2">
									<ExpressionUnit line="1" col="1" source="2">
										<PrimitiveLiteral line="1" col="1" source="2">
											<NUMBER line="1" col="1" value="2">2</NUMBER>
										</PrimitiveLiteral>
									</ExpressionUnit>
								</ExpressionUnarySymbol>
							</ExpressionExponential>
						</ExpressionMultiplicative>
					</ExpressionAdditive>
					<PUNCTUATOR line="1" col="3" value="+">+</PUNCTUATOR>
					<ExpressionMultiplicative line="1" col="5" source="-3">
						<ExpressionExponential line="1" col="5" source="-3">
							<ExpressionUnarySymbol line="1" col="5" source="-3">
								<ExpressionUnit line="1" col="5" source="-3">
									<PrimitiveLiteral line="1" col="5" source="-3">
										<NUMBER line="1" col="5" value="-3">-3</NUMBER>
									</PrimitiveLiteral>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
			<PUNCTUATOR line="1" col="7" value=";">;</PUNCTUATOR>
		</Statement>
	</Goal__0__List>
	<FILEBOUND value="false">␃</FILEBOUND>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Parse grouping.', () => {
	const tree = new Parser('(2 + -3);').parse()
	expect(tree.serialize()).toBe(`
<Goal source="␂ ( 2 + -3 ) ; ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Goal__0__List line="1" col="1" source="( 2 + -3 ) ;">
		<Statement line="1" col="1" source="( 2 + -3 ) ;">
			<Expression line="1" col="1" source="( 2 + -3 )">
				<ExpressionAdditive line="1" col="1" source="( 2 + -3 )">
					<ExpressionMultiplicative line="1" col="1" source="( 2 + -3 )">
						<ExpressionExponential line="1" col="1" source="( 2 + -3 )">
							<ExpressionUnarySymbol line="1" col="1" source="( 2 + -3 )">
								<ExpressionUnit line="1" col="1" source="( 2 + -3 )">
									<PUNCTUATOR line="1" col="1" value="(">(</PUNCTUATOR>
									<Expression line="1" col="2" source="2 + -3">
										<ExpressionAdditive line="1" col="2" source="2 + -3">
											<ExpressionAdditive line="1" col="2" source="2">
												<ExpressionMultiplicative line="1" col="2" source="2">
													<ExpressionExponential line="1" col="2" source="2">
														<ExpressionUnarySymbol line="1" col="2" source="2">
															<ExpressionUnit line="1" col="2" source="2">
																<PrimitiveLiteral line="1" col="2" source="2">
																	<NUMBER line="1" col="2" value="2">2</NUMBER>
																</PrimitiveLiteral>
															</ExpressionUnit>
														</ExpressionUnarySymbol>
													</ExpressionExponential>
												</ExpressionMultiplicative>
											</ExpressionAdditive>
											<PUNCTUATOR line="1" col="4" value="+">+</PUNCTUATOR>
											<ExpressionMultiplicative line="1" col="6" source="-3">
												<ExpressionExponential line="1" col="6" source="-3">
													<ExpressionUnarySymbol line="1" col="6" source="-3">
														<ExpressionUnit line="1" col="6" source="-3">
															<PrimitiveLiteral line="1" col="6" source="-3">
																<NUMBER line="1" col="6" value="-3">-3</NUMBER>
															</PrimitiveLiteral>
														</ExpressionUnit>
													</ExpressionUnarySymbol>
												</ExpressionExponential>
											</ExpressionMultiplicative>
										</ExpressionAdditive>
									</Expression>
									<PUNCTUATOR line="1" col="8" value=")">)</PUNCTUATOR>
								</ExpressionUnit>
							</ExpressionUnarySymbol>
						</ExpressionExponential>
					</ExpressionMultiplicative>
				</ExpressionAdditive>
			</Expression>
			<PUNCTUATOR line="1" col="9" value=";">;</PUNCTUATOR>
		</Statement>
	</Goal__0__List>
	<FILEBOUND value="false">␃</FILEBOUND>
</Goal>
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
