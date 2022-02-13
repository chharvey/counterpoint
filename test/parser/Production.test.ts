import * as assert from 'assert';
import * as xjs from 'extrajs';
import type {
	NonemptyArray,
} from '../../src/lib/index.js';
import type {
	EBNFObject,
} from '../../src/index.js';
import type {GrammarSymbol} from '../../src/parser/utils-private.js';
import {Production} from '../../src/parser/Production.js';



describe('Production', () => {
	class ProductionUnit extends Production {
		static readonly instance: ProductionUnit = new ProductionUnit();
		override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
			return [
				['(', ')'],
				['(', ProductionUnit.instance, ')'],
			];
		}
	}

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
				class ProductionUnit extends Production {
					static readonly instance: ProductionUnit = new ProductionUnit();
					override get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
						return [
							[TERMINAL.TerminalNumber.instance],
							['(', TERMINAL.TerminalOperator.instance, ProductionUnit.instance, ProductionUnit.instance, ')'],
						];
					}
				}
			`, xjs.String.dedent`
				class ProductionGoal extends Production {
					static readonly instance: ProductionGoal = new ProductionGoal();
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
			assert.strictEqual(ProductionUnit.instance.displayName, 'Unit');
		});
	});
});
