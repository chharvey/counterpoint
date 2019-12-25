import {STX, ETX} from './Scanner.class'
import {
	TerminalStringLiteral,
	TerminalStringTemplateFull,
	TerminalStringTemplateHead,
	TerminalStringTemplateMiddle,
	TerminalStringTemplateTail,
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


export class ProductionFile extends Production {
	static readonly instance: ProductionFile = new ProductionFile()
	readonly TAGNAME: string = 'File'
	get sequences(): GrammarSymbol[][] {
		return [
			[STX,                                   ETX],
			[STX, ProductionFile__0__List.instance, ETX],
		]
	}
	random(): string[] {
		return [STX, ...ProductionFile__0__List.instance.random(), ETX]
	}
}
export class ProductionFile__0__List extends Production {
	static readonly instance: ProductionFile__0__List = new ProductionFile__0__List()
	readonly TAGNAME: string = 'File__0__List'
	get sequences(): GrammarSymbol[][] {
		return [
			[                                  ProductionStatement.instance],
			[ProductionFile__0__List.instance, ProductionStatement.instance],
		]
	}
	random(): string[] {
		return [
			...(Util.randomBool() ? [] : this.random()),
			...ProductionStatement.instance.random(),
		]
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
			[TerminalStringTemplateFull.instance],
			[TerminalStringTemplateHead.instance,                                                                            TerminalStringTemplateTail.instance],
			[TerminalStringTemplateHead.instance, ProductionExpression.instance,                                             TerminalStringTemplateTail.instance],
			[TerminalStringTemplateHead.instance,                                ProductionStringTemplate__0__List.instance, TerminalStringTemplateTail.instance],
			[TerminalStringTemplateHead.instance, ProductionExpression.instance, ProductionStringTemplate__0__List.instance, TerminalStringTemplateTail.instance],

		]
	}
	random(): string[] {
		if (Util.randomBool()) {
			return [TerminalStringTemplateFull.instance.random()]
		} else {
			return [
				TerminalStringTemplateHead.instance.random(),
				...(Util.randomBool() ? [] : ProductionExpression.instance.random()),
				...(Util.randomBool() ? [] : ProductionStringTemplate__0__List.instance.random()),
				TerminalStringTemplateTail.instance.random(),
			]
		}
	}
}
export class ProductionStringTemplate__0__List extends Production {
	static readonly instance: ProductionStringTemplate__0__List = new ProductionStringTemplate__0__List()
	readonly TAGNAME: string = 'StringTemplate__0__List'
	get sequences(): GrammarSymbol[][] {
		return [
			[                                            TerminalStringTemplateMiddle.instance                               ],
			[                                            TerminalStringTemplateMiddle.instance, ProductionExpression.instance],
			[ProductionStringTemplate__0__List.instance, TerminalStringTemplateMiddle.instance                               ],
			[ProductionStringTemplate__0__List.instance, TerminalStringTemplateMiddle.instance, ProductionExpression.instance],
		]
	}
	random(): string[] {
		return [
			...(Util.randomBool() ? [] : ProductionStringTemplate__0__List.instance.random()),
			TerminalStringTemplateMiddle.instance.random(),
			...(Util.randomBool() ? [] : ProductionExpression.instance.random()),
		]
	}
}
export class ProductionPrimitiveLiteral extends Production {
	static readonly instance: ProductionPrimitiveLiteral = new ProductionPrimitiveLiteral()
	readonly TAGNAME: string = 'PrimitiveLiteral'
	get sequences(): GrammarSymbol[][] {
		return [
			[TerminalNumber       .instance],
			[TerminalStringLiteral.instance],
		]
	}
	random(): string[] {
		return [
			Util.randomBool() ? TerminalNumber.instance.random() : TerminalStringLiteral.instance.random()
		]
	}
}
