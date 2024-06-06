import * as assert from 'assert';
import * as xjs from 'extrajs';
import {Grammar} from '../../src/parser/Grammar.js';



describe('Grammar', () => {
	describe('.fromJSON', () => {
		it('returns a string representing a new instance of Grammar.', () => {
			assert.strictEqual(Grammar.fromJSON([
				{
					name: 'Unit',
					defn: [
						[{term: 'NUMBER'}],
						['(', {term: 'OPERATOR'}, {prod: 'Unit'}, {prod: 'Unit'}, ')'],
					],
				},
				{
					name: 'Goal',
					defn: [
						['\\u0002',                 '\\u0003'],
						['\\u0002', {prod: 'Unit'}, '\\u0003'],
					],
				},
			]), xjs.String.dedent`
				export const GRAMMAR: Grammar = new Grammar([
					ProductionUnit.instance,
					ProductionGoal.instance,
				], ProductionGoal.instance);
			`);
		});
	});
});
