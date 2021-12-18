import * as assert from 'assert';
import * as xjs from 'extrajs';
import type {
	EBNFObject,
} from '../../src/index.js';
import {ParseNode} from '../../src/parser/ParseNode.js';



describe('ParseNode', () => {
	describe('.fromJSON', () => {
		it('returns a string representing new subclasses of ParseNode.', () => {
			assert.deepStrictEqual(([
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
			] as EBNFObject[]).map((prod) => ParseNode.fromJSON(prod)), [xjs.String.dedent`
				export class ParseNodeUnit extends ParseNode {
					declare readonly children:
						| readonly [Token]
						| readonly [Token, Token, ParseNodeUnit, ParseNodeUnit, Token]
					;
				}
			`, xjs.String.dedent`
				export class ParseNodeGoal extends ParseNode {
					declare readonly children:
						| readonly [Token, Token]
						| readonly [Token, ParseNodeUnit, Token]
					;
				}
			`]);
		});
	});
});
