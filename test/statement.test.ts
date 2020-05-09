import * as assert from 'assert'

import Parser from '../src/class/Parser.class'

import {SemanticNodeGoal_compileOutput} from './compile.test'



suite('Empty statements.', () => {
	test('Decorate empty statement.', () => {
		assert.strictEqual(new Parser(';').parse().decorate().serialize(), `
<Goal source="␂ ; ␃">
	<StatementList line="1" col="1" source=";">
		<StatementEmpty line="1" col="1" source=";"/>
	</StatementList>
</Goal>
		`.replace(/\n\t*/g, ''))
	})

	test('Compile empty statement.', () => {
		assert.strictEqual(new Parser(';').parse().decorate().compile(), SemanticNodeGoal_compileOutput(''))
	})
})



suite('Assignment statements.', () => {
	const input: string = `
let unfixed the_answer = 42;
let \`the £ answer\` = the_answer * 10;
the_answer = the_answer - \\z14;
	`.trim()

	test('Decorate assignment statements.', () => {
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
				<Expression line="3" col="14" source="the_answer - &#x5c;z14" operator="+">
					<Identifier line="3" col="14" source="the_answer" id="128"/>
					<Expression line="3" col="27" source="&#x5c;z14" operator="-">
						<Constant line="3" col="27" source="&#x5c;z14" value="40"/>
					</Expression>
				</Expression>
			</Assigned>
		</Assignment>
	</StatementList>
</Goal>
		`.replace(/\n\t*/g, ''))
	})
})
