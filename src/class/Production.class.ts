import Util from './Util.class'
import Dev from './Dev.class'
import {
	Filebound,
	Punctuator,
	Keyword,
} from '../lexer/Token.class'
import type ParseNode from './ParseNode.class'
import {GrammarSymbol, Rule} from './Grammar.class'
import Terminal, {
	TerminalIdentifier,
	TerminalInteger,
	TerminalFloat,
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
			[TerminalInteger.instance],
			[TerminalFloat  .instance],
			[TerminalString .instance],
		] : [
			[Keyword.NULL],
			[Keyword.FALSE],
			[Keyword.TRUE],
			[TerminalInteger.instance],
			[TerminalFloat  .instance],
		]
	}
	random(): string[] {
		const random: number = Math.random()
		return Dev.supports('literalString') ? [
			random < 1/6 ? Keyword.NULL  :
			random < 2/6 ? Keyword.FALSE :
			random < 3/6 ? Keyword.TRUE  :
			random < 4/6 ? TerminalInteger.instance.random() :
			random < 5/6 ? TerminalFloat  .instance.random() :
			               TerminalString .instance.random()
		] : [
			random < 1/5 ? Keyword.NULL  :
			random < 2/5 ? Keyword.FALSE :
			random < 3/5 ? Keyword.TRUE  :
			random < 4/5 ? TerminalInteger.instance.random() :
			               TerminalFloat  .instance.random()
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
			...Terminal.maybeA(ProductionExpression.instance.random),
			...Terminal.maybeA(ProductionStringTemplate.__0__List.instance.random),
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
				...Terminal.maybeA(this.random),
				TerminalTemplateMiddle.instance.random(),
				...Terminal.maybeA(ProductionExpression.instance.random),
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
			random < 1/4 ? [TerminalIdentifier        .instance.random()] :
			random < 2/4 ?  ProductionPrimitiveLiteral.instance.random()  :
			random < 3/4 ?  ProductionStringTemplate  .instance.random()  :
			[Punctuator.GRP_OPN, ...ProductionExpression.instance.random(), Punctuator.GRP_CLS]
		) : Dev.supports('variables') ? (
			random < 1/3 ? [TerminalIdentifier        .instance.random()] :
			random < 2/3 ?  ProductionPrimitiveLiteral.instance.random()  :
			[Punctuator.GRP_OPN, ...ProductionExpression.instance.random(), Punctuator.GRP_CLS]
		) : Dev.supports('literalTemplate') ? (
			random < 1/3 ? ProductionPrimitiveLiteral.instance.random() :
			random < 2/3 ? ProductionStringTemplate  .instance.random() :
			[Punctuator.GRP_OPN, ...ProductionExpression.instance.random(), Punctuator.GRP_CLS]
		) : (
			random < 1/2 ? ProductionPrimitiveLiteral.instance.random()  :
			[Punctuator.GRP_OPN, ...ProductionExpression.instance.random(), Punctuator.GRP_CLS]
		)
	}
}
export class ProductionExpressionUnarySymbol extends Production {
	static readonly instance: ProductionExpressionUnarySymbol = new ProductionExpressionUnarySymbol()
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionExpressionUnit.instance],
			[Punctuator.NOT, this],
			[Punctuator.EMP, this],
			[Punctuator.AFF, this],
			[Punctuator.NEG, this],
		]
	}
	random(): string[] {
		return Util.randomBool() ?
			ProductionExpressionUnit.instance.random() :
			[Util.arrayRandom([
				Punctuator.NOT,
				Punctuator.EMP,
				Punctuator.AFF,
				Punctuator.NEG,
			]), ...this.random()]
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
			...Terminal.maybeA(() => [Punctuator.EXP, ...this.random()]),
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
			...Terminal.maybeA(() => [...this.random(), Util.arrayRandom([Punctuator.MUL, Punctuator.DIV])]),
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
			...Terminal.maybeA(() => [...this.random(), Util.arrayRandom([Punctuator.ADD, Punctuator.SUB])]),
			...ProductionExpressionMultiplicative.instance.random(),
		]
	}
}
export class ProductionExpressionComparative extends Production {
	static readonly instance: ProductionExpressionComparative = new ProductionExpressionComparative()
	get sequences(): GrammarSymbol[][] {
		return [
			[                      ProductionExpressionAdditive.instance],
			[this, Punctuator.LT,  ProductionExpressionAdditive.instance],
			[this, Punctuator.GT,  ProductionExpressionAdditive.instance],
			[this, Punctuator.LE,  ProductionExpressionAdditive.instance],
			[this, Punctuator.GE,  ProductionExpressionAdditive.instance],
			[this, Punctuator.NLT, ProductionExpressionAdditive.instance],
			[this, Punctuator.NGT, ProductionExpressionAdditive.instance],
		]
	}
	random(): string[] {
		return [
			...Terminal.maybeA(() => [...this.random(), Util.arrayRandom([
				Punctuator.LT,
				Punctuator.GT,
				Punctuator.LE,
				Punctuator.GE,
				Punctuator.NLT,
				Punctuator.NGT,
			])]),
			...ProductionExpressionAdditive.instance.random(),
		]
	}
}
export class ProductionExpressionEquality extends Production {
	static readonly instance: ProductionExpressionEquality = new ProductionExpressionEquality()
	get sequences(): GrammarSymbol[][] {
		return [
			[                       ProductionExpressionComparative.instance],
			[this, Keyword   .IS,   ProductionExpressionComparative.instance],
			[this, Keyword   .ISNT, ProductionExpressionComparative.instance],
			[this, Punctuator.EQ,   ProductionExpressionComparative.instance],
			[this, Punctuator.NEQ,  ProductionExpressionComparative.instance],
		]
	}
	random(): string[] {
		return [
			...Terminal.maybeA(() => [...this.random(), Util.arrayRandom([
				Keyword   .IS,
				Keyword   .ISNT,
				Punctuator.EQ,
				Punctuator.NEQ,
			])]),
			...ProductionExpressionComparative.instance.random(),
		]
	}
}
export class ProductionExpressionConjunctive extends Production {
	static readonly instance: ProductionExpressionConjunctive = new ProductionExpressionConjunctive()
	get sequences(): GrammarSymbol[][] {
		return [
			[                       ProductionExpressionEquality.instance],
			[this, Punctuator.AND,  ProductionExpressionEquality.instance],
			[this, Punctuator.NAND, ProductionExpressionEquality.instance],
		]
	}
	random(): string[] {
		return [
			...Terminal.maybeA(() => [...this.random(), Util.arrayRandom([Punctuator.AND, Punctuator.NAND])]),
			...ProductionExpressionEquality.instance.random(),
		]
	}
}
export class ProductionExpressionDisjunctive extends Production {
	static readonly instance: ProductionExpressionDisjunctive = new ProductionExpressionDisjunctive()
	get sequences(): GrammarSymbol[][] {
		return [
			[                      ProductionExpressionConjunctive.instance],
			[this, Punctuator.OR,  ProductionExpressionConjunctive.instance],
			[this, Punctuator.NOR, ProductionExpressionConjunctive.instance],
		]
	}
	random(): string[] {
		return [
			...Terminal.maybeA(() => [...this.random(), Util.arrayRandom([Punctuator.OR, Punctuator.NOR])]),
			...ProductionExpressionConjunctive.instance.random(),
		]
	}
}
export class ProductionExpressionConditional extends Production {
	static readonly instance: ProductionExpressionConditional = new ProductionExpressionConditional()
	get sequences(): GrammarSymbol[][] {
		return [
			[
				Keyword.IF,   ProductionExpression.instance,
				Keyword.THEN, ProductionExpression.instance,
				Keyword.ELSE, ProductionExpression.instance,
			],
		]
	}
	random(): string[] {
		return [
			Keyword.IF,   ...ProductionExpression.instance.random(),
			Keyword.THEN, ...ProductionExpression.instance.random(),
			Keyword.ELSE, ...ProductionExpression.instance.random(),
		]
	}
}
export class ProductionExpression extends Production {
	static readonly instance: ProductionExpression = new ProductionExpression()
	get sequences(): GrammarSymbol[][] {
		return [
			[ProductionExpressionDisjunctive.instance],
			[ProductionExpressionConditional.instance],
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
			Terminal.maybe(() => Keyword.UNFIXED),
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
			random < 1/4 ? [                                           Punctuator.ENDSTAT] :
			random < 2/4 ? [...ProductionExpression.instance.random(), Punctuator.ENDSTAT] :
			random < 3/4 ? ProductionDeclarationVariable.instance.random() :
			               ProductionStatementAssignment.instance.random()
		) : (
			random < 1/2 ? [                                           Punctuator.ENDSTAT] :
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
				...Terminal.maybeA(this.random),
				...ProductionStatement.instance.random(),
			]
		}
	}
}
