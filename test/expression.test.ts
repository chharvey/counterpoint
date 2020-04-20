import * as assert from 'assert'

import Parser from '../src/class/Parser.class'

import {SemanticNodeGoal_compileOutput} from './compile.test'



test('Parse expression unit.', () => {
	assert.strictEqual(new Parser('42;').parse().serialize(), `
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



test('Decorate expression unit.', () => {
	assert.strictEqual(new Parser('42;').parse().decorate().serialize(), `
<Goal source="␂ 42 ; ␃">
	<StatementList line="1" col="1" source="42 ;">
		<StatementExpression line="1" col="1" source="42 ;">
			<Constant line="1" col="1" source="42" value="42"/>
		</StatementExpression>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Compile expression unit.', () => {
	assert.strictEqual(new Parser('42;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`
		STACK.push(42)
	`))
})



test('Parse unary symbol.', () => {
	assert.strictEqual(new Parser('- 42;').parse().serialize(), `
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



test('Decorate unary symbol.', () => {
	assert.strictEqual(new Parser('- 42;').parse().decorate().serialize(), `
<Goal source="␂ - 42 ; ␃">
	<StatementList line="1" col="1" source="- 42 ;">
		<StatementExpression line="1" col="1" source="- 42 ;">
			<Expression line="1" col="1" source="- 42" operator="-">
				<Constant line="1" col="3" source="42" value="42"/>
			</Expression>
		</StatementExpression>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Parse exponential.', () => {
	assert.strictEqual(new Parser('2 ^ -3;').parse().serialize(), `
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



test('Decorate exponential.', () => {
	assert.strictEqual(new Parser('2 ^ -3;').parse().decorate().serialize(), `
<Goal source="␂ 2 ^ -3 ; ␃">
	<StatementList line="1" col="1" source="2 ^ -3 ;">
		<StatementExpression line="1" col="1" source="2 ^ -3 ;">
			<Expression line="1" col="1" source="2 ^ -3" operator="^">
				<Constant line="1" col="1" source="2" value="2"/>
				<Constant line="1" col="5" source="-3" value="-3"/>
			</Expression>
		</StatementExpression>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Parse multiplicative.', () => {
	assert.strictEqual(new Parser('2 * -3;').parse().serialize(), `
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



test('Decorate multiplicative.', () => {
	assert.strictEqual(new Parser('2 * -3;').parse().decorate().serialize(), `
		<Goal source="␂ 2 * -3 ; ␃">
			<StatementList line="1" col="1" source="2 * -3 ;">
				<StatementExpression line="1" col="1" source="2 * -3 ;">
					<Expression line="1" col="1" source="2 * -3" operator="*">
						<Constant line="1" col="1" source="2" value="2"/>
						<Constant line="1" col="5" source="-3" value="-3"/>
					</Expression>
				</StatementExpression>
			</StatementList>
		</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Parse additive.', () => {
	assert.strictEqual(new Parser('2 + -3;').parse().serialize(), `
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



test('Decorate additive.', () => {
	assert.strictEqual(new Parser('2 + -3;').parse().decorate().serialize(), `
		<Goal source="␂ 2 + -3 ; ␃">
			<StatementList line="1" col="1" source="2 + -3 ;">
				<StatementExpression line="1" col="1" source="2 + -3 ;">
					<Expression line="1" col="1" source="2 + -3" operator="+">
						<Constant line="1" col="1" source="2" value="2"/>
						<Constant line="1" col="5" source="-3" value="-3"/>
					</Expression>
				</StatementExpression>
			</StatementList>
		</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Decorate subtractive.', () => {
	assert.strictEqual(new Parser('2 - 3;').parse().decorate().serialize(), `
		<Goal source="␂ 2 - 3 ; ␃">
			<StatementList line="1" col="1" source="2 - 3 ;">
				<StatementExpression line="1" col="1" source="2 - 3 ;">
					<Expression line="1" col="1" source="2 - 3" operator="+">
						<Constant line="1" col="1" source="2" value="2"/>
						<Expression line="1" col="5" source="3" operator="-">
							<Constant line="1" col="5" source="3" value="3"/>
						</Expression>
					</Expression>
				</StatementExpression>
			</StatementList>
		</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Compile additive.', () => {
	assert.strictEqual(new Parser('42 + 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)



STACK.push(420)

STACK.push(ADD)
	`))
})



test('Compile file subtractive.', () => {
	assert.strictEqual(new Parser('42 - 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)




STACK.push(420)


STACK.push(NEG)

STACK.push(ADD)
	`))
})



test('Compile compound expression.', () => {
	assert.strictEqual(new Parser('42 ^ 2 * 420;').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`


STACK.push(42)



STACK.push(2)

STACK.push(EXP)



STACK.push(420)

STACK.push(MUL)
	`))
})



test('Parse grouping.', () => {
	assert.strictEqual(new Parser('(2 + -3);').parse().serialize(), `
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



test('Decorate grouping.', () => {
	assert.strictEqual(new Parser('(2 + -3);').parse().decorate().serialize(), `
<Goal source="␂ ( 2 + -3 ) ; ␃">
	<StatementList line="1" col="1" source="( 2 + -3 ) ;">
		<StatementExpression line="1" col="1" source="( 2 + -3 ) ;">
			<Expression line="1" col="2" source="2 + -3" operator="+">
				<Constant line="1" col="2" source="2" value="2"/>
				<Constant line="1" col="6" source="-3" value="-3"/>
			</Expression>
		</StatementExpression>
	</StatementList>
</Goal>
	`.replace(/\n\t*/g, ''))
})



test('Compile compound expression, grouping.', () => {
	assert.strictEqual(new Parser('42 ^ (2 * 420);').parse().decorate().compile(), SemanticNodeGoal_compileOutput(`

STACK.push(42)




STACK.push(2)



STACK.push(420)

STACK.push(MUL)

STACK.push(EXP)
	`))
})



test('Parse full.', () => {
	assert.doesNotThrow(() => {
		new Parser(`
5  +  30

+ 6 ^ - (2 - 37 *

3 - 50 + - 2

- 5 + 03) *  -2 *

600  /  3  *  2

/ 600  /  (3  *  2) ^

4 * 2 ^ 3

- 60 * -2 / 12 +

 4 * 222 ^ 3;
		`.trim()).parse()
	})
})
