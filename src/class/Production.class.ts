import Util from './Util.class'
import Dev from './Dev.class'
import {
	Filebound,
	Punctuator,
	Keyword,
} from './Token.class'
import type ParseNode from './ParseNode.class'
import {GrammarSymbol, Rule} from './Grammar.class'
import {
	TerminalIdentifier,
	TerminalNumber,
	TerminalString,
	TerminalTemplateFull,
	TerminalTemplateHead,
	TerminalTemplateMiddle,
	TerminalTemplateTail,
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


export class ProductionPrimitiveLiteral extends Production {
	static readonly instance: ProductionPrimitiveLiteral = new ProductionPrimitiveLiteral()
	get sequences(): GrammarSymbol[][] {
		return Dev.supports('literalString') ? [
			[Keyword.NULL],
			[Keyword.FALSE],
			[Keyword.TRUE],
			[TerminalNumber.instance],
			[TerminalString.instance],
		] : [
			[Keyword.NULL],
			[Keyword.FALSE],
			[Keyword.TRUE],
			[TerminalNumber.instance],
		]
	}
	random(): string[] {
		const random: number = Math.random()
		return Dev.supports('literalString') ? [
			random < 0.2 ? Keyword.NULL :
			random < 0.4 ? Keyword.FALSE :
			random < 0.6 ? Keyword.TRUE :
			random < 0.8 ? TerminalNumber.instance.random() :
			               TerminalString.instance.random()
		] : [
			random < 0.25 ? Keyword.NULL :
			random < 0.50 ? Keyword.FALSE :
			random < 0.75 ? Keyword.TRUE :
			                TerminalNumber.instance.random()
		]
	}
}
export class ProductionStringTemplate extends Production {
	static readonly instance: ProductionStringTemplate = new ProductionStringTemplate()
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
	static readonly __0__List = class ProductionStringTemplate__0__List extends Production {
		static readonly instance: ProductionStringTemplate__0__List = new ProductionStringTemplate__0__List()
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
export class ProductionExpressionUnit extends Production {
	static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit()
	get sequences(): GrammarSymbol[][] {
		return Dev.supportsAll('variables', 'literalTemplate') ? [
			[TerminalIdentifier        .instance],
			[ProductionPrimitiveLiteral.instance],
			[ProductionStringTemplate  .instance],
			[Punctuator.GRP_OPN, ProductionExpression.instance, Punctuator.GRP_CLS],
		] : Dev.supports('variables') ? [
			[TerminalIdentifier        .instance],
			[ProductionPrimitiveLiteral.instance],
			[Punctuator.GRP_OPN, ProductionExpression.instance, Punctuator.GRP_CLS],
		] : Dev.supports('literalTemplate') ? [
			[ProductionPrimitiveLiteral.instance],
			[ProductionStringTemplate  .instance],
			[Punctuator.GRP_OPN, ProductionExpression.instance, Punctuator.GRP_CLS],
		] : [
			[ProductionPrimitiveLiteral.instance],
			[Punctuator.GRP_OPN, ProductionExpression.instance, Punctuator.GRP_CLS],
		]
	}
	random(): string[] {
		const random: number = Math.random()
		return Dev.supportsAll('variables', 'literalTemplate') ? (
			random < 0.25 ? [TerminalIdentifier        .instance.random()] :
			random < 0.50 ?  ProductionPrimitiveLiteral.instance.random()  :
			random < 0.75 ?  ProductionStringTemplate  .instance.random()  :
			[Punctuator.GRP_OPN, ...ProductionExpression.instance.random(), Punctuator.GRP_CLS]
		) : Dev.supports('variables') ? (
			random < 0.333 ? [TerminalIdentifier        .instance.random()] :
			random < 0.667 ?  ProductionPrimitiveLiteral.instance.random()  :
			[Punctuator.GRP_OPN, ...ProductionExpression.instance.random(), Punctuator.GRP_CLS]
		) : Dev.supports('literalTemplate') ? (
			random < 0.333 ? ProductionPrimitiveLiteral.instance.random() :
			random < 0.667 ? ProductionStringTemplate  .instance.random() :
			[Punctuator.GRP_OPN, ...ProductionExpression.instance.random(), Punctuator.GRP_CLS]
		) : (
			random < 0.5 ? ProductionPrimitiveLiteral.instance.random()  :
			[Punctuator.GRP_OPN, ...ProductionExpression.instance.random(), Punctuator.GRP_CLS]
		)
	}
}
export class ProductionExpressionUnarySymbol extends Production {
	static readonly instance: ProductionExpressionUnarySymbol = new ProductionExpressionUnarySymbol()
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionExpressionUnit.instance],
			[Punctuator.AFF, this],
			[Punctuator.NEG, this],
		]
	}
	random(): string[] {
		return Util.randomBool() ?
			ProductionExpressionUnit.instance.random() :
			[Util.arrayRandom([Punctuator.AFF, Punctuator.NEG]), ...this.random()]
	}
}
export class ProductionExpressionExponential extends Production {
	static readonly instance: ProductionExpressionExponential = new ProductionExpressionExponential()
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionExpressionUnarySymbol.instance                      ],
			[ProductionExpressionUnarySymbol.instance, Punctuator.EXP, this],
		]
	}
	random(): string[] {
		return [
			...ProductionExpressionUnarySymbol.instance.random(),
			...(Util.randomBool() ? [] : [Punctuator.EXP, ...this.random()]),
		]
	}
}
export class ProductionExpressionMultiplicative extends Production {
	static readonly instance: ProductionExpressionMultiplicative = new ProductionExpressionMultiplicative()
	get sequences(): GrammarSymbol[][] {
		return [
			[                      ProductionExpressionExponential.instance],
			[this, Punctuator.MUL, ProductionExpressionExponential.instance],
			[this, Punctuator.DIV, ProductionExpressionExponential.instance],
		]
	}
	random(): string[] {
		return [
			...(Util.randomBool() ? [] : [...this.random(), Util.arrayRandom([Punctuator.MUL, Punctuator.DIV])]),
			...ProductionExpressionExponential.instance.random(),
		]
	}
}
export class ProductionExpressionAdditive extends Production {
	static readonly instance: ProductionExpressionAdditive = new ProductionExpressionAdditive()
	get sequences(): GrammarSymbol[][] {
		return [
			[                      ProductionExpressionMultiplicative.instance],
			[this, Punctuator.ADD, ProductionExpressionMultiplicative.instance],
			[this, Punctuator.SUB, ProductionExpressionMultiplicative.instance],
		]
	}
	random(): string[] {
		return [
			...(Util.randomBool() ? [] : [...this.random(), Util.arrayRandom([Punctuator.ADD, Punctuator.SUB])]),
			...ProductionExpressionMultiplicative.instance.random(),
		]
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
export class ProductionDeclarationVariable extends Production {
	static readonly instance: ProductionDeclarationVariable = new ProductionDeclarationVariable()
	get sequences(): GrammarSymbol[][] {
		return [
			[Keyword.LET,                  TerminalIdentifier.instance, Punctuator.ASSIGN, ProductionExpression.instance, Punctuator.ENDSTAT],
			[Keyword.LET, Keyword.UNFIXED, TerminalIdentifier.instance, Punctuator.ASSIGN, ProductionExpression.instance, Punctuator.ENDSTAT],
		]
	}
	random(): string[] {
		return [
			Keyword.LET,
			Util.randomBool() ? '' : Keyword.UNFIXED,
			TerminalIdentifier.instance.random(),
			Punctuator.ASSIGN,
			...ProductionExpression.instance.random(),
			Punctuator.ENDSTAT,
		]
	}
}
export class ProductionStatementAssignment extends Production {
	static readonly instance: ProductionStatementAssignment = new ProductionStatementAssignment()
	get sequences(): GrammarSymbol[][] {
		return [
			[TerminalIdentifier.instance, Punctuator.ASSIGN, ProductionExpression.instance, Punctuator.ENDSTAT],
		]
	}
	random(): string[] {
		return [
			TerminalIdentifier.instance.random(),
			Punctuator.ASSIGN,
			...ProductionExpression.instance.random(),
			Punctuator.ENDSTAT,
		]
	}
}
export class ProductionStatement extends Production {
	static readonly instance: ProductionStatement = new ProductionStatement()
	get sequences(): GrammarSymbol[][] {
		return Dev.supports('variables') ? [
			[                               Punctuator.ENDSTAT],
			[ProductionExpression.instance, Punctuator.ENDSTAT],
			[ProductionDeclarationVariable.instance],
			[ProductionStatementAssignment.instance],
		] : [
			[                               Punctuator.ENDSTAT],
			[ProductionExpression.instance, Punctuator.ENDSTAT],
		]
	}
	random(): string[] {
		const random: number = Math.random()
		return Dev.supports('variables') ? (
			random < 0.25 ? [                                           Punctuator.ENDSTAT] :
			random < 0.50 ? [...ProductionExpression.instance.random(), Punctuator.ENDSTAT] :
			random < 0.75 ? ProductionDeclarationVariable.instance.random() :
			                ProductionStatementAssignment.instance.random()
		) : (
			random < 0.50 ? [                                           Punctuator.ENDSTAT] :
			                [...ProductionExpression.instance.random(), Punctuator.ENDSTAT]
		)
	}
}
export class ProductionGoal extends Production {
	static readonly instance: ProductionGoal = new ProductionGoal()
	get sequences(): GrammarSymbol[][] {
		return [
			[Filebound.SOT,                                    Filebound.EOT],
			[Filebound.SOT, ProductionGoal.__0__List.instance, Filebound.EOT],
		]
	}
	random(): string[] {
		return [Filebound.SOT, ...ProductionGoal.__0__List.instance.random(), Filebound.EOT]
	}
	static readonly __0__List = class ProductionGoal__0__List extends Production {
		static readonly instance: ProductionGoal__0__List = new ProductionGoal__0__List()
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
