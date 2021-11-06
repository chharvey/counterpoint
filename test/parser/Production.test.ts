import * as assert from 'assert';
import * as xjs from 'extrajs';
import type {
	EBNFObject,
} from '../../src/index.js';
import {Production} from '../../src/parser/Production.js';
import {Rule} from '../../src/parser/Rule.js';
import * as PROD from '../../src/parser/ParserSolid.js';



describe('Production', () => {
	describe('.fromJSON', () => {
		it('returns a string representing new subclasses of Production.', () => {
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
			] as EBNFObject[]).map((prod) => Production.fromJSON(prod)), [xjs.String.dedent`
				export class ProductionUnit extends Production {
					static readonly instance: ProductionUnit = new ProductionUnit();
					/** @implements Production */
					override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalNumber.instance],
							['(', TERMINAL.TerminalOperator.instance, ProductionUnit.instance, ProductionUnit.instance, ')'],
						];
					}
				}
			`, xjs.String.dedent`
				export class ProductionGoal extends Production {
					static readonly instance: ProductionGoal = new ProductionGoal();
					/** @implements Production */
					override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							['\\u0002', '\\u0003'],
							['\\u0002', ProductionUnit.instance, '\\u0003'],
						];
					}
				}
			`]);
		});
	});

	describe('#displayName', () => {
		it('returns the display name.', () => {
			assert.strictEqual(PROD.ProductionWord.instance.displayName, 'Word');
		});
	});

	describe('#toRules', () => {
		it('decomposes the production into a list of rules.', () => {
			assert.deepStrictEqual(PROD.ProductionWord.instance.toRules(), [
				new Rule(PROD.ProductionWord.instance, 0),
				new Rule(PROD.ProductionWord.instance, 1),
			]);
		});
	});
});
