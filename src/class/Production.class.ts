import Util from './Util.class'
import {STX, ETX} from './Char.class'
import type ParseNode from './ParseNode.class'
import {GrammarSymbol, Rule} from './Grammar.class'
import {
	TerminalNumber,
} from './Terminal.class'



/**
 * A Production is an item in a formal context-free grammar.
 * It consists of a nonterminal on the left-hand side, which serves as the identifier of the production,
 * and on the right-hand side one ore more choices, or sequences of terminals and/or nonterminals,
 * which can be reduced to the left-hand side nonterminal in a parsing action.
 */
export default abstract class Production {
	protected constructor() {}

	/** @final */ get displayName(): string {
		return this.constructor.name.slice('Production'.length)
	}

	/**
	 * A set of sequences of parse symbols (terminals and/or nonterminals) in this production.
	 */
	abstract get sequences(): GrammarSymbol[][];

	/**
	 * Generate a random instance of this Production.
	 * @returns a well-formed sequence of strings satisfying this Production
	 */
	abstract random(): string[];

	/**
	 * Does the given ParseNode satisfy a Rule in this Production?
	 * @param   candidate - a ParseNode to test
	 * @returns             Does the given ParseNode satisfy a Rule in this Production?
	 * @final
	 */
	match(candidate: ParseNode): boolean {
		return candidate.rule.production.equals(this)
	}

	/**
	 * Is this production “equal to” the argument?
	 *
	 * Two productions are “equal” if they are the same object, or all of the following are true:
	 * - The corresponding rules of both productions are “equal” (by {@link Rule#equals}).
	 *
	 * @param   prod - the production to compare
	 * @returns        is this production “equal to” the argument?
	 */
	equals(prod: Production) {
		return this === prod ||
			Util.equalArrays<Rule>(this.toRules(), prod.toRules(), (r1, r2) => r1.equals(r2))
	}

	/**
	 * Generate grammar rules from this Production.
	 * @returns this Production split into several rules
	 */
	toRules(): Rule[] {
		return this.sequences.map((_, i) => new Rule(this, i))
	}
}



export class ProductionFile extends Production {
	static readonly instance: ProductionFile = new ProductionFile()
	get sequences(): GrammarSymbol[][] {
		return [
			[STX,                                ETX],
			[STX, ProductionExpression.instance, ETX],
		]
	}
	random(): string[] {
		return [STX, ...ProductionExpression.instance.random(), ETX]
	}
}
export class ProductionExpression extends Production {
	static readonly instance: ProductionExpression = new ProductionExpression()
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionExpressionAdditive.instance],
		]
	}
	random(): string[] {
		return ProductionExpressionAdditive.instance.random()
	}
}
export class ProductionExpressionAdditive extends Production {
	static readonly instance: ProductionExpressionAdditive = new ProductionExpressionAdditive()
	get sequences(): GrammarSymbol[][] {
		return [
			[           ProductionExpressionMultiplicative.instance],
			[this, '+', ProductionExpressionMultiplicative.instance],
			[this, '-', ProductionExpressionMultiplicative.instance],
		]
	}
	random(): string[] {
		return [
			...(Util.randomBool() ? [] : [...this.random(), Util.arrayRandom(['+','-'])]),
			...ProductionExpressionMultiplicative.instance.random(),
		]
	}
}
export class ProductionExpressionMultiplicative extends Production {
	static readonly instance: ProductionExpressionMultiplicative = new ProductionExpressionMultiplicative()
	get sequences(): GrammarSymbol[][] {
		return [
			[           ProductionExpressionExponential.instance],
			[this, '*', ProductionExpressionExponential.instance],
			[this, '/', ProductionExpressionExponential.instance],
		]
	}
	random(): string[] {
		return [
			...(Util.randomBool() ? [] : [...this.random(), Util.arrayRandom(['*','/'])]),
			...ProductionExpressionExponential.instance.random(),
		]
	}
}
export class ProductionExpressionExponential extends Production {
	static readonly instance: ProductionExpressionExponential = new ProductionExpressionExponential()
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionExpressionUnarySymbol.instance           ],
			[ProductionExpressionUnarySymbol.instance, '^', this],
		]
	}
	random(): string[] {
		return [
			...ProductionExpressionUnarySymbol.instance.random(),
			...(Util.randomBool() ? [] : ['^', ...this.random()]),
		]
	}
}
export class ProductionExpressionUnarySymbol extends Production {
	static readonly instance: ProductionExpressionUnarySymbol = new ProductionExpressionUnarySymbol()
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionExpressionUnit.instance],
			['+', this],
			['-', this],
		]
	}
	random(): string[] {
		return Util.randomBool() ?
			ProductionExpressionUnit.instance.random() :
			[Util.arrayRandom(['+','-']), ...this.random()]
	}
}
export class ProductionExpressionUnit extends Production {
	static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit()
	get sequences(): GrammarSymbol[][] {
		return [
			[TerminalNumber.instance],
			['(', ProductionExpression.instance, ')'],
		]
	}
	random(): string[] {
		return Util.randomBool() ?
			[TerminalNumber.instance.random()] :
			['(', ...ProductionExpression.instance.random(), ')']
	}
}
