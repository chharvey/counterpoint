import {
	ParseNode,
	Parser,
} from '@chharvey/parser';

import type SolidConfig from '../SolidConfig'
import Dev from '../class/Dev.class'
import {
	LexerSolid,
} from '../lexer/'
import {
	Validator,
} from '../validator/'
import * as PARSENODE from './ParseNode.auto'
import Grammar, {
} from './Grammar.class'
import type Production from './Production.class'
import * as PRODUCTION from './Production.auto'



export class ParserSolid extends Parser {
	/**
	 * Construct a new ParserSolid object.
	 * @param source - the source text
	 */
	constructor (source: string) {
		// @ts-expect-error
		super(source, LexerSolid, new Grammar([
			PRODUCTION.ProductionPrimitiveLiteral.instance,
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeKeyword             .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeUnit                .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeUnarySymbol         .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeIntersection        .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionTypeUnion               .instance] : []),
			...(Dev.supports('typingExplicit')  ? [PRODUCTION.ProductionType                    .instance] : []),
			...(Dev.supports('literalTemplate') ? [PRODUCTION.ProductionStringTemplate__1__List .instance] : []),
			...(Dev.supports('literalTemplate') ? [PRODUCTION.ProductionStringTemplate          .instance] : []),
			PRODUCTION.ProductionExpressionUnit           .instance,
			PRODUCTION.ProductionExpressionUnarySymbol    .instance,
			PRODUCTION.ProductionExpressionExponential    .instance,
			PRODUCTION.ProductionExpressionMultiplicative .instance,
			PRODUCTION.ProductionExpressionAdditive       .instance,
			PRODUCTION.ProductionExpressionComparative    .instance,
			PRODUCTION.ProductionExpressionEquality       .instance,
			PRODUCTION.ProductionExpressionConjunctive    .instance,
			PRODUCTION.ProductionExpressionDisjunctive    .instance,
			PRODUCTION.ProductionExpressionConditional    .instance,
			PRODUCTION.ProductionExpression               .instance,
			...(Dev.supportsAll('variables', 'typingExplicit') ? [PRODUCTION.ProductionDeclarationVariable.instance] : []),
			...(Dev.supports   ('variables')                   ? [PRODUCTION.ProductionStatementAssignment.instance] : []),
			PRODUCTION.ProductionStatement.instance,
			PRODUCTION.ProductionGoal__0__List.instance,
			PRODUCTION.ProductionGoal.instance,
		], PRODUCTION.ProductionGoal.instance), new Map<Production, typeof ParseNode>([
			[PRODUCTION.ProductionPrimitiveLiteral.instance, PARSENODE.ParseNodePrimitiveLiteral],
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeKeyword             .instance, PARSENODE.ParseNodeTypeKeyword]             as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeUnit                .instance, PARSENODE.ParseNodeTypeUnit]                as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeUnarySymbol         .instance, PARSENODE.ParseNodeTypeUnarySymbol]         as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeIntersection        .instance, PARSENODE.ParseNodeTypeIntersection]        as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionTypeUnion               .instance, PARSENODE.ParseNodeTypeUnion]               as const] : []),
			...(Dev.supports('typingExplicit')  ? [[PRODUCTION.ProductionType                    .instance, PARSENODE.ParseNodeType]                    as const] : []),
			...(Dev.supports('literalTemplate') ? [[PRODUCTION.ProductionStringTemplate__1__List .instance, PARSENODE.ParseNodeStringTemplate__1__List] as const] : []),
			...(Dev.supports('literalTemplate') ? [[PRODUCTION.ProductionStringTemplate          .instance, PARSENODE.ParseNodeStringTemplate]          as const] : []),
			[PRODUCTION.ProductionExpressionUnit           .instance, PARSENODE.ParseNodeExpressionUnit],
			[PRODUCTION.ProductionExpressionUnarySymbol    .instance, PARSENODE.ParseNodeExpressionUnarySymbol],
			[PRODUCTION.ProductionExpressionExponential    .instance, PARSENODE.ParseNodeExpressionExponential],
			[PRODUCTION.ProductionExpressionMultiplicative .instance, PARSENODE.ParseNodeExpressionMultiplicative],
			[PRODUCTION.ProductionExpressionAdditive       .instance, PARSENODE.ParseNodeExpressionAdditive],
			[PRODUCTION.ProductionExpressionComparative    .instance, PARSENODE.ParseNodeExpressionComparative],
			[PRODUCTION.ProductionExpressionEquality       .instance, PARSENODE.ParseNodeExpressionEquality],
			[PRODUCTION.ProductionExpressionConjunctive    .instance, PARSENODE.ParseNodeExpressionConjunctive],
			[PRODUCTION.ProductionExpressionDisjunctive    .instance, PARSENODE.ParseNodeExpressionDisjunctive],
			[PRODUCTION.ProductionExpressionConditional    .instance, PARSENODE.ParseNodeExpressionConditional],
			[PRODUCTION.ProductionExpression               .instance, PARSENODE.ParseNodeExpression],
			...(Dev.supports('variables') ? [[PRODUCTION.ProductionDeclarationVariable.instance, PARSENODE.ParseNodeDeclarationVariable] as const] : []),
			...(Dev.supports('variables') ? [[PRODUCTION.ProductionStatementAssignment.instance, PARSENODE.ParseNodeStatementAssignment] as const] : []),
			[PRODUCTION.ProductionStatement     .instance, PARSENODE.ParseNodeStatement],
			[PRODUCTION.ProductionGoal__0__List .instance, PARSENODE.ParseNodeGoal__0__List],
			[PRODUCTION.ProductionGoal          .instance, PARSENODE.ParseNodeGoal],
		]))
	}

	parse(): PARSENODE.ParseNodeGoal {
		return super.parse() as PARSENODE.ParseNodeGoal
	}
}
