import * as assert from 'assert'
import * as xjs from 'extrajs';
import {Parser} from '../../src/parser/Parser.js';



describe('Parser', () => {
	describe('.fromJSON', () => {
		it('returns a string representing a new subclass of Parser.', () => {
			assert.strictEqual(Parser.fromJSON(JSON.parse(`
				[
					{
						"name": "Unit",
						"defn": [
							[{"term":"NUMBER"}],
							["(", {"term":"OPERATOR"}, {"prod":"Unit"}, {"prod":"Unit"}, ")"]
						]
					},
					{
						"name": "Goal",
						"defn": [
							["\\u0002", "\\u0003"],
							["\\u0002", {"prod":"Unit"}, "\\u0003"]
						]
					}
				]
			`)), (xjs.String.dedent`
				export const PARSER: Parser<ParseNodeGoal> = new Parser<ParseNodeGoal>(
					LEXER,
					GRAMMAR,
					new Map<Production, typeof ParseNode>([
						[ProductionUnit.instance, ParseNodeUnit],
						[ProductionGoal.instance, ParseNodeGoal],
					]),
				);
			`));
		});
	});
});
