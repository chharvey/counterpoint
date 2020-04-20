import * as assert from 'assert'

import Parser from '../src/class/Parser.class'



suite('Empty statements.', () => {
	test('Parse empty statement.', () => {
		assert.strictEqual(new Parser(';').parse().serialize(), `
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
		assert.strictEqual(new Parser(';').parse().decorate().serialize(), `
<Goal source="␂ ; ␃">
	<StatementList line="1" col="1" source=";">
		<StatementEmpty line="1" col="1" source=";"/>
	</StatementList>
</Goal>
		`.replace(/\n\t*/g, ''))
	})

	test.skip('Compile empty statement.', () => {
		assert.strictEqual(new Parser(';').parse().decorate().compile(), `
export default void 0
export default __2
		`.trim())
	})
})



suite('Assignment statements.', () => {
	const input: string = `
let unfixed the_answer = 42;
let \`the £ answer\` = the_answer * 10;
the_answer = the_answer - \\z14;
	`.trim()

	test('Parse assignment statements.', () => {
		assert.strictEqual(new Parser(input).parse().serialize(), `
<Goal source="␂ let unfixed the_answer = 42 ; let \`the £ answer\` = the_answer * 10 ; the_answer = the_answer - &#x5c;z14 ; ␃">
	<FILEBOUND value="true">␂</FILEBOUND>
	<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ; let \`the £ answer\` = the_answer * 10 ; the_answer = the_answer - &#x5c;z14 ;">
		<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ; let \`the £ answer\` = the_answer * 10 ;">
			<Goal__0__List line="1" col="1" source="let unfixed the_answer = 42 ;">
				<Statement line="1" col="1" source="let unfixed the_answer = 42 ;">
					<DeclarationVariable line="1" col="1" source="let unfixed the_answer = 42 ;">
						<WORD line="1" col="1" value="0">let</WORD>
						<WORD line="1" col="5" value="1">unfixed</WORD>
						<WORD line="1" col="13" value="128">the_answer</WORD>
						<PUNCTUATOR line="1" col="24" value="=">=</PUNCTUATOR>
						<Expression line="1" col="26" source="42">
							<ExpressionAdditive line="1" col="26" source="42">
								<ExpressionMultiplicative line="1" col="26" source="42">
									<ExpressionExponential line="1" col="26" source="42">
										<ExpressionUnarySymbol line="1" col="26" source="42">
											<ExpressionUnit line="1" col="26" source="42">
												<PrimitiveLiteral line="1" col="26" source="42">
													<NUMBER line="1" col="26" value="42">42</NUMBER>
												</PrimitiveLiteral>
											</ExpressionUnit>
										</ExpressionUnarySymbol>
									</ExpressionExponential>
								</ExpressionMultiplicative>
							</ExpressionAdditive>
						</Expression>
						<PUNCTUATOR line="1" col="28" value=";">;</PUNCTUATOR>
					</DeclarationVariable>
				</Statement>
			</Goal__0__List>
			<Statement line="2" col="1" source="let \`the £ answer\` = the_answer * 10 ;">
				<DeclarationVariable line="2" col="1" source="let \`the £ answer\` = the_answer * 10 ;">
					<WORD line="2" col="1" value="0">let</WORD>
					<WORD line="2" col="5" value="129">\`the £ answer\`</WORD>
					<PUNCTUATOR line="2" col="20" value="=">=</PUNCTUATOR>
					<Expression line="2" col="22" source="the_answer * 10">
						<ExpressionAdditive line="2" col="22" source="the_answer * 10">
							<ExpressionMultiplicative line="2" col="22" source="the_answer * 10">
								<ExpressionMultiplicative line="2" col="22" source="the_answer">
									<ExpressionExponential line="2" col="22" source="the_answer">
										<ExpressionUnarySymbol line="2" col="22" source="the_answer">
											<ExpressionUnit line="2" col="22" source="the_answer">
												<WORD line="2" col="22" value="128">the_answer</WORD>
											</ExpressionUnit>
										</ExpressionUnarySymbol>
									</ExpressionExponential>
								</ExpressionMultiplicative>
								<PUNCTUATOR line="2" col="33" value="*">*</PUNCTUATOR>
								<ExpressionExponential line="2" col="35" source="10">
									<ExpressionUnarySymbol line="2" col="35" source="10">
										<ExpressionUnit line="2" col="35" source="10">
											<PrimitiveLiteral line="2" col="35" source="10">
												<NUMBER line="2" col="35" value="10">10</NUMBER>
											</PrimitiveLiteral>
										</ExpressionUnit>
									</ExpressionUnarySymbol>
								</ExpressionExponential>
							</ExpressionMultiplicative>
						</ExpressionAdditive>
					</Expression>
					<PUNCTUATOR line="2" col="37" value=";">;</PUNCTUATOR>
				</DeclarationVariable>
			</Statement>
		</Goal__0__List>
		<Statement line="3" col="1" source="the_answer = the_answer - &#x5c;z14 ;">
			<StatementAssignment line="3" col="1" source="the_answer = the_answer - &#x5c;z14 ;">
				<WORD line="3" col="1" value="128">the_answer</WORD>
				<PUNCTUATOR line="3" col="12" value="=">=</PUNCTUATOR>
				<Expression line="3" col="14" source="the_answer - &#x5c;z14">
					<ExpressionAdditive line="3" col="14" source="the_answer - &#x5c;z14">
						<ExpressionAdditive line="3" col="14" source="the_answer">
							<ExpressionMultiplicative line="3" col="14" source="the_answer">
								<ExpressionExponential line="3" col="14" source="the_answer">
									<ExpressionUnarySymbol line="3" col="14" source="the_answer">
										<ExpressionUnit line="3" col="14" source="the_answer">
											<WORD line="3" col="14" value="128">the_answer</WORD>
										</ExpressionUnit>
									</ExpressionUnarySymbol>
								</ExpressionExponential>
							</ExpressionMultiplicative>
						</ExpressionAdditive>
						<PUNCTUATOR line="3" col="25" value="-">-</PUNCTUATOR>
						<ExpressionMultiplicative line="3" col="27" source="&#x5c;z14">
							<ExpressionExponential line="3" col="27" source="&#x5c;z14">
								<ExpressionUnarySymbol line="3" col="27" source="&#x5c;z14">
									<ExpressionUnit line="3" col="27" source="&#x5c;z14">
										<PrimitiveLiteral line="3" col="27" source="&#x5c;z14">
											<NUMBER line="3" col="27" value="40">\\z14</NUMBER>
										</PrimitiveLiteral>
									</ExpressionUnit>
								</ExpressionUnarySymbol>
							</ExpressionExponential>
						</ExpressionMultiplicative>
					</ExpressionAdditive>
				</Expression>
				<PUNCTUATOR line="3" col="31" value=";">;</PUNCTUATOR>
			</StatementAssignment>
		</Statement>
	</Goal__0__List>
	<FILEBOUND value="false">␃</FILEBOUND>
</Goal>
		`.replace(/\n\t*/g, ''))
	})

	test.skip('Decorate assignment statements.', () => {
		assert.strictEqual(new Parser(input).parse().decorate().serialize(), `
<Goal source="␂ let unfixed the_answer = 42 ; let \`the £ answer\` = the_answer * 10 ; the_answer = the_answer - &#x5c;z14 ; ␃">
	<StatementList line="1" col="1" source="let unfixed the_answer = 42 ; let \`the £ answer\` = the_answer * 10 ; the_answer = the_answer - &#x5c;z14 ;">
		<Declaration line="1" col="1" source="let unfixed the_answer = 42 ;" type="variable" unfixed="true">
			<Assignee line="1" col="13" source="the_answer">
				<Identifier line="1" col="13" source="the_answer" id="128"/>
			</Assignee>
			<Assigned line="1" col="26" source="42">
				<Constant line="1" col="26" source="42" value="42"/>
			</Assigned>
		</Declaration>
		<Declaration line="2" col="1" source="let \`the £ answer\` = the_answer * 10 ;" type="variable" unfixed="false">
			<Assignee line="2" col="5" source="\`the £ answer\`">
				<Identifier line="2" col="5" source="\`the £ answer\`" id="129"/>
			</Assignee>
			<Assigned line="2" col="22" source="the_answer * 10">
				<Expression line="2" col="22" source="the_answer * 10" operator="*">
					<Identifier line="2" col="22" source="the_answer" id="128"/>
					<Constant line="2" col="35" source="10" value="10"/>
				</Expression>
			</Assigned>
		</Declaration>
		<Assignment line="3" col="1" source="the_answer = the_answer - &#x5c;z14 ;">
			<Assignee line="3" col="1" source="the_answer">
				<Identifier line="3" col="1" source="the_answer" id="128"/>
			</Assignee>
			<Assigned line="3" col="14" source="the_answer - &#x5c;z14">
				<Expression line="3" col="14" source="the_answer - &#x5c;z14" operator="-">
					<Identifier line="3" col="14" source="the_answer" id="128"/>
					<Constant line="3" col="27" source="&#x5c;z14" value="40"/>
				</Expression>
			</Assigned>
		</Assignment>
	</StatementList>
</Goal>
		`.replace(/\n\t*/g, ''))
	})
})



test('Parse Errors', () => {
	assert.throws(() => {
		new Parser('2 3').parse()
	}, /Unexpected token/)
})
