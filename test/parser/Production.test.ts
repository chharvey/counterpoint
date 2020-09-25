import * as assert from 'assert'

import Util from '../../src/class/Util.class'
import {
	Production,
} from '../../src/parser/'



describe('Production', () => {
	describe('.fromJSON', () => {
		it('returns a string representing new subclasses of Production.', () => {
			assert.strictEqual(Util.dedent(Production.fromJSON([{
				"name": "ExpressionUnit",
				"defn": [
					[{"term": "IDENTIFIER"}],
					[{"prod": "PrimitiveLiteral"}],
					[{"prod": "StringTemplate"}],
					["'('", {"prod": "Expression"}, "')'"]
				]
			}])), Util.dedent(`
				import type {GrammarSymbol}     from './Grammar.class';
				import * as Terminal            from './Terminal.class';
				import Production, {KleenePlus} from './Production.class';

					export class ProductionExpressionUnit extends Production {
						static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit();
						get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
							return [
								${ `
									[Terminal.TerminalIdentifier.instance],
									[ProductionPrimitiveLiteral .instance],
									[ProductionStringTemplate   .instance],
									['(', ProductionExpression.instance, ')'],
								`.replace(/\s+/g, '') }
							];
						}
						random(): string[] {
							const random: number = Math.random();
							return (
								${ [
									`random < 1/4 ? [Terminal.TerminalIdentifier.instance.random()] :`,
									`random < 2/4 ? [...ProductionPrimitiveLiteral.instance.random()] :`,
									`random < 3/4 ? [...ProductionStringTemplate.instance.random()] :`,
								].join(' ') }
								['(',...ProductionExpression.instance.random(),')']
							);
						}
					}
			`))
		})
	})
})
