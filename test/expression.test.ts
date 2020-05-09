import * as assert from 'assert'

import Parser from '../src/class/Parser.class'

import {SemanticNodeGoal_compileOutput} from './compile.test'



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
