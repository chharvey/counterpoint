import {STX, ETX} from './Scanner.class'
import {
	TerminalString,
	TerminalTemplateFull,
	TerminalTemplateHead,
	TerminalTemplateMiddle,
	TerminalTemplateTail,
	TerminalNumber,
	TerminalIdentifier,
} from './Terminal.class'
import {GrammarSymbol, Rule} from './Grammar.class'
import Util from './Util.class'


/**
 * A Production is an item in a formal context-free grammar.
 * It consists of a nonterminal on the left-hand side, which serves as the identifier of the production,
 * and on the right-hand side one ore more choices, or sequences of terminals and/or nonterminals,
 * which can be reduced to the left-hand side nonterminal in a parsing action.
 */
export default abstract class Production {
	protected constructor() {}
	abstract readonly TAGNAME: string;
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
	 * Generate grammar rules from this Production.
	 * @returns this Production split into several rules
	 */
	toRules(): Rule[] {
		return this.sequences.map((_, i) => new Rule(this, i))
	}
}


export class ProductionGoal extends Production {
	static readonly instance: ProductionGoal = new ProductionGoal()
	readonly TAGNAME: string = 'Goal'
	get sequences(): GrammarSymbol[][] {
		return [
			[STX,                                   ETX],
			[STX, ProductionGoal.__0__List.instance, ETX],
		]
	}
	random(): string[] {
		return [STX, ...ProductionGoal.__0__List.instance.random(), ETX]
	}
	static readonly __0__List = class __0__List extends Production {
		static readonly instance: __0__List = new __0__List()
		readonly TAGNAME: string = 'Goal__0__List'
		get sequences(): GrammarSymbol[][] {
			return [
				[      ProductionStatement.instance],
				[this, ProductionStatement.instance],
			]
		}
		random(): string[] {
			return [
				...(Util.randomBool() ? [] : this.random()),
				...ProductionStatement.instance.random(),
			]
		}
	}
}
export class ProductionStatement extends Production {
	static readonly instance: ProductionStatement = new ProductionStatement()
	readonly TAGNAME: string = 'Statement'
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionDeclarationVariable.instance],
			[ProductionStatementAssignment.instance],
			[ProductionExpression.instance, ';'],
		]
	}
	random(): string[] {
		const random: number = Math.random()
		return (
			random < 0.33 ?  ProductionDeclarationVariable.instance.random() :
			random < 0.67 ?  ProductionStatementAssignment.instance.random() :
			[...ProductionExpression.instance.random(), ';']
		)
	}
}
export class ProductionDeclarationVariable extends Production {
	static readonly instance: ProductionDeclarationVariable = new ProductionDeclarationVariable()
	readonly TAGNAME: string = 'DeclarationVariable'
	get sequences(): GrammarSymbol[][] {
		return [
			['let',            TerminalIdentifier.instance, '=', ProductionExpression.instance, ';'],
			['let', 'unfixed', TerminalIdentifier.instance, '=', ProductionExpression.instance, ';'],
		]
	}
	random(): string[] {
		return [
			'let',
			Util.randomBool() ? '' : 'unfixed',
			TerminalIdentifier.instance.random(),
			'=',
			...ProductionExpression.instance.random(),
			';',
		]
	}
}
export class ProductionStatementAssignment extends Production {
	static readonly instance: ProductionStatementAssignment = new ProductionStatementAssignment()
	readonly TAGNAME: string = 'StatementAssignment'
	get sequences(): GrammarSymbol[][] {
		return [
			[TerminalIdentifier.instance, '=', ProductionExpression.instance, ';'],
		]
	}
	random(): string[] {
		return [
			TerminalIdentifier.instance.random(),
			'=',
			...ProductionExpression.instance.random(),
			';',
		]
	}
}
export class ProductionExpression extends Production {
	static readonly instance: ProductionExpression = new ProductionExpression()
	readonly TAGNAME: string = 'Expression'
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
	readonly TAGNAME: string = 'ExpressionAdditive'
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
	readonly TAGNAME: string = 'ExpressionMultiplicative'
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
	readonly TAGNAME: string = 'ExpressionExponential'
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
	readonly TAGNAME: string = 'ExpressionUnarySymbol'
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
	readonly TAGNAME: string = 'ExpressionUnit'
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionPrimitiveLiteral.instance],
			[ProductionStringTemplate  .instance],
			[TerminalIdentifier        .instance],
			['(', ProductionExpression.instance, ')'],
		]
	}
	random(): string[] {
		const random: number = Math.random()
		return (
			random < 0.25 ?  ProductionPrimitiveLiteral.instance.random()  :
			random < 0.50 ?  ProductionStringTemplate  .instance.random()  :
			random < 0.75 ? [TerminalIdentifier        .instance.random()] :
			['(', ...ProductionExpression.instance.random(), ')']
		)
	}
}
export class ProductionStringTemplate extends Production {
	static readonly instance: ProductionStringTemplate = new ProductionStringTemplate()
	readonly TAGNAME: string = 'StringTemplate'
	get sequences(): GrammarSymbol[][] {
		return [
			[TerminalTemplateFull.instance],
			[TerminalTemplateHead.instance,                                                                             TerminalTemplateTail.instance],
			[TerminalTemplateHead.instance, ProductionExpression.instance,                                              TerminalTemplateTail.instance],
			[TerminalTemplateHead.instance,                                ProductionStringTemplate.__0__List.instance, TerminalTemplateTail.instance],
			[TerminalTemplateHead.instance, ProductionExpression.instance, ProductionStringTemplate.__0__List.instance, TerminalTemplateTail.instance],

		]
	}
	random(): string[] {
		return Util.randomBool() ? [TerminalTemplateFull.instance.random()] : [
			TerminalTemplateHead.instance.random(),
			...(Util.randomBool() ? [] : ProductionExpression.instance.random()),
			...(Util.randomBool() ? [] : ProductionStringTemplate.__0__List.instance.random()),
			TerminalTemplateTail.instance.random(),
		]
	}
	static readonly __0__List = class __0__List extends Production {
		static readonly instance: __0__List = new __0__List()
		readonly TAGNAME: string = 'StringTemplate__0__List'
		get sequences(): GrammarSymbol[][] {
			return [
				[      TerminalTemplateMiddle.instance                               ],
				[      TerminalTemplateMiddle.instance, ProductionExpression.instance],
				[this, TerminalTemplateMiddle.instance                               ],
				[this, TerminalTemplateMiddle.instance, ProductionExpression.instance],
			]
		}
		random(): string[] {
			return [
				...(Util.randomBool() ? [] : this.random()),
				TerminalTemplateMiddle.instance.random(),
				...(Util.randomBool() ? [] : ProductionExpression.instance.random()),
			]
		}
	}
}
export class ProductionPrimitiveLiteral extends Production {
	static readonly instance: ProductionPrimitiveLiteral = new ProductionPrimitiveLiteral()
	readonly TAGNAME: string = 'PrimitiveLiteral'
	get sequences(): GrammarSymbol[][] {
		return [
			[TerminalNumber.instance],
			[TerminalString.instance],
		]
	}
	random(): string[] {
		return [
			Util.randomBool() ? TerminalNumber.instance.random() : TerminalString.instance.random()
		]
	}
}
