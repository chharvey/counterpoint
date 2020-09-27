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
				import type {
					KleenePlus,
					GrammarSymbol,
				} from '../parser/Grammar.class';
				import Production from '../parser/Production.class';
				import * as TERMINAL from './Terminal.class';

					export class ProductionExpressionUnit extends Production {
						static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit();
						get sequences(): KleenePlus<KleenePlus<GrammarSymbol>> {
							return [
								${ `
									[TERMINAL.TerminalIdentifier.instance],
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
									`random < 1/4 ? [TERMINAL.TerminalIdentifier.instance.random()] :`,
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
