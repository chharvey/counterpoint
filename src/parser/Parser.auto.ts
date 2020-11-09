
		/*----------------------------------------------------------------/
		| WARNING: Do not manually update this file!
		| It is auto-generated via <@chharvey/parser>.
		| If you need to make updates, make them there.
		/----------------------------------------------------------------*/
		import SolidConfig, {CONFIG_DEFAULT} from '../SolidConfig';
		
		import {
			NonemptyArray,
			Token,
			ParseNode,
			Parser,
			Production,
			Grammar,
			GrammarSymbol,
		} from '@chharvey/parser';
		import {LexerSolid} from './Lexer';
		import * as TERMINAL from './Terminal';
		
			export class ProductionPrimitiveLiteral extends Production {
				static readonly instance: ProductionPrimitiveLiteral = new ProductionPrimitiveLiteral();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['null'],['false'],['true'],[TERMINAL.TerminalInteger.instance],[TERMINAL.TerminalFloat.instance],[TERMINAL.TerminalString.instance],
					];
				}
			}
		
			export class ProductionTypeKeyword extends Production {
				static readonly instance: ProductionTypeKeyword = new ProductionTypeKeyword();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['bool'],['int'],['float'],['obj'],
					];
				}
			}
		
			export class ProductionTypeUnit extends Production {
				static readonly instance: ProductionTypeUnit = new ProductionTypeUnit();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionPrimitiveLiteral.instance],[ProductionTypeKeyword.instance],['(',ProductionType.instance,')'],
					];
				}
			}
		
			export class ProductionTypeUnarySymbol extends Production {
				static readonly instance: ProductionTypeUnarySymbol = new ProductionTypeUnarySymbol();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionTypeUnit.instance],[ProductionTypeUnarySymbol.instance,'!'],
					];
				}
			}
		
			export class ProductionTypeIntersection extends Production {
				static readonly instance: ProductionTypeIntersection = new ProductionTypeIntersection();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionTypeUnarySymbol.instance],[ProductionTypeIntersection.instance,'&',ProductionTypeUnarySymbol.instance],
					];
				}
			}
		
			export class ProductionTypeUnion extends Production {
				static readonly instance: ProductionTypeUnion = new ProductionTypeUnion();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionTypeIntersection.instance],[ProductionTypeUnion.instance,'|',ProductionTypeIntersection.instance],
					];
				}
			}
		
			export class ProductionType extends Production {
				static readonly instance: ProductionType = new ProductionType();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionTypeUnion.instance],
					];
				}
			}
		
			export class ProductionStringTemplate__1__List extends Production {
				static readonly instance: ProductionStringTemplate__1__List = new ProductionStringTemplate__1__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalTemplateMiddle.instance],[ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateMiddle.instance],[TERMINAL.TerminalTemplateMiddle.instance,ProductionExpression.instance],[ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateMiddle.instance,ProductionExpression.instance],
					];
				}
			}
		
			export class ProductionStringTemplate_Dynamic__1__List extends Production {
				static readonly instance: ProductionStringTemplate_Dynamic__1__List = new ProductionStringTemplate_Dynamic__1__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalTemplateMiddle.instance],[ProductionStringTemplate_Dynamic__1__List.instance,TERMINAL.TerminalTemplateMiddle.instance],[TERMINAL.TerminalTemplateMiddle.instance,ProductionExpression_Dynamic.instance],[ProductionStringTemplate_Dynamic__1__List.instance,TERMINAL.TerminalTemplateMiddle.instance,ProductionExpression_Dynamic.instance],
					];
				}
			}
		
			export class ProductionStringTemplate extends Production {
				static readonly instance: ProductionStringTemplate = new ProductionStringTemplate();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalTemplateFull.instance],[TERMINAL.TerminalTemplateHead.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionExpression.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionExpression.instance,ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateTail.instance],
					];
				}
			}
		
			export class ProductionStringTemplate_Dynamic extends Production {
				static readonly instance: ProductionStringTemplate_Dynamic = new ProductionStringTemplate_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalTemplateFull.instance],[TERMINAL.TerminalTemplateHead.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionStringTemplate_Dynamic__1__List.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionExpression_Dynamic.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionExpression_Dynamic.instance,ProductionStringTemplate_Dynamic__1__List.instance,TERMINAL.TerminalTemplateTail.instance],
					];
				}
			}
		
			export class ProductionExpressionUnit extends Production {
				static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionPrimitiveLiteral.instance],[ProductionStringTemplate.instance],['(',ProductionExpression.instance,')'],
					];
				}
			}
		
			export class ProductionExpressionUnit_Dynamic extends Production {
				static readonly instance: ProductionExpressionUnit_Dynamic = new ProductionExpressionUnit_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalIdentifier.instance],[ProductionPrimitiveLiteral.instance],[ProductionStringTemplate_Dynamic.instance],['(',ProductionExpression_Dynamic.instance,')'],
					];
				}
			}
		
			export class ProductionExpressionUnarySymbol extends Production {
				static readonly instance: ProductionExpressionUnarySymbol = new ProductionExpressionUnarySymbol();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionUnit.instance],['!',ProductionExpressionUnarySymbol.instance],['?',ProductionExpressionUnarySymbol.instance],['+',ProductionExpressionUnarySymbol.instance],['-',ProductionExpressionUnarySymbol.instance],
					];
				}
			}
		
			export class ProductionExpressionUnarySymbol_Dynamic extends Production {
				static readonly instance: ProductionExpressionUnarySymbol_Dynamic = new ProductionExpressionUnarySymbol_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionUnit_Dynamic.instance],['!',ProductionExpressionUnarySymbol_Dynamic.instance],['?',ProductionExpressionUnarySymbol_Dynamic.instance],['+',ProductionExpressionUnarySymbol_Dynamic.instance],['-',ProductionExpressionUnarySymbol_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpressionExponential extends Production {
				static readonly instance: ProductionExpressionExponential = new ProductionExpressionExponential();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionUnarySymbol.instance],[ProductionExpressionUnarySymbol.instance,'^',ProductionExpressionExponential.instance],
					];
				}
			}
		
			export class ProductionExpressionExponential_Dynamic extends Production {
				static readonly instance: ProductionExpressionExponential_Dynamic = new ProductionExpressionExponential_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionUnarySymbol_Dynamic.instance],[ProductionExpressionUnarySymbol_Dynamic.instance,'^',ProductionExpressionExponential_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpressionMultiplicative extends Production {
				static readonly instance: ProductionExpressionMultiplicative = new ProductionExpressionMultiplicative();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionExponential.instance],[ProductionExpressionMultiplicative.instance,'*',ProductionExpressionExponential.instance],[ProductionExpressionMultiplicative.instance,'/',ProductionExpressionExponential.instance],
					];
				}
			}
		
			export class ProductionExpressionMultiplicative_Dynamic extends Production {
				static readonly instance: ProductionExpressionMultiplicative_Dynamic = new ProductionExpressionMultiplicative_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionExponential_Dynamic.instance],[ProductionExpressionMultiplicative_Dynamic.instance,'*',ProductionExpressionExponential_Dynamic.instance],[ProductionExpressionMultiplicative_Dynamic.instance,'/',ProductionExpressionExponential_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpressionAdditive extends Production {
				static readonly instance: ProductionExpressionAdditive = new ProductionExpressionAdditive();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionMultiplicative.instance],[ProductionExpressionAdditive.instance,'+',ProductionExpressionMultiplicative.instance],[ProductionExpressionAdditive.instance,'-',ProductionExpressionMultiplicative.instance],
					];
				}
			}
		
			export class ProductionExpressionAdditive_Dynamic extends Production {
				static readonly instance: ProductionExpressionAdditive_Dynamic = new ProductionExpressionAdditive_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionMultiplicative_Dynamic.instance],[ProductionExpressionAdditive_Dynamic.instance,'+',ProductionExpressionMultiplicative_Dynamic.instance],[ProductionExpressionAdditive_Dynamic.instance,'-',ProductionExpressionMultiplicative_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpressionComparative extends Production {
				static readonly instance: ProductionExpressionComparative = new ProductionExpressionComparative();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,'<',ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,'>',ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,'<=',ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,'>=',ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,'!<',ProductionExpressionAdditive.instance],[ProductionExpressionComparative.instance,'!>',ProductionExpressionAdditive.instance],
					];
				}
			}
		
			export class ProductionExpressionComparative_Dynamic extends Production {
				static readonly instance: ProductionExpressionComparative_Dynamic = new ProductionExpressionComparative_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionAdditive_Dynamic.instance],[ProductionExpressionComparative_Dynamic.instance,'<',ProductionExpressionAdditive_Dynamic.instance],[ProductionExpressionComparative_Dynamic.instance,'>',ProductionExpressionAdditive_Dynamic.instance],[ProductionExpressionComparative_Dynamic.instance,'<=',ProductionExpressionAdditive_Dynamic.instance],[ProductionExpressionComparative_Dynamic.instance,'>=',ProductionExpressionAdditive_Dynamic.instance],[ProductionExpressionComparative_Dynamic.instance,'!<',ProductionExpressionAdditive_Dynamic.instance],[ProductionExpressionComparative_Dynamic.instance,'!>',ProductionExpressionAdditive_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpressionEquality extends Production {
				static readonly instance: ProductionExpressionEquality = new ProductionExpressionEquality();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,'is',ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,'isnt',ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,'==',ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,'!=',ProductionExpressionComparative.instance],
					];
				}
			}
		
			export class ProductionExpressionEquality_Dynamic extends Production {
				static readonly instance: ProductionExpressionEquality_Dynamic = new ProductionExpressionEquality_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionComparative_Dynamic.instance],[ProductionExpressionEquality_Dynamic.instance,'is',ProductionExpressionComparative_Dynamic.instance],[ProductionExpressionEquality_Dynamic.instance,'isnt',ProductionExpressionComparative_Dynamic.instance],[ProductionExpressionEquality_Dynamic.instance,'==',ProductionExpressionComparative_Dynamic.instance],[ProductionExpressionEquality_Dynamic.instance,'!=',ProductionExpressionComparative_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpressionConjunctive extends Production {
				static readonly instance: ProductionExpressionConjunctive = new ProductionExpressionConjunctive();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionEquality.instance],[ProductionExpressionConjunctive.instance,'&&',ProductionExpressionEquality.instance],[ProductionExpressionConjunctive.instance,'!&',ProductionExpressionEquality.instance],
					];
				}
			}
		
			export class ProductionExpressionConjunctive_Dynamic extends Production {
				static readonly instance: ProductionExpressionConjunctive_Dynamic = new ProductionExpressionConjunctive_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionEquality_Dynamic.instance],[ProductionExpressionConjunctive_Dynamic.instance,'&&',ProductionExpressionEquality_Dynamic.instance],[ProductionExpressionConjunctive_Dynamic.instance,'!&',ProductionExpressionEquality_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpressionDisjunctive extends Production {
				static readonly instance: ProductionExpressionDisjunctive = new ProductionExpressionDisjunctive();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionConjunctive.instance],[ProductionExpressionDisjunctive.instance,'||',ProductionExpressionConjunctive.instance],[ProductionExpressionDisjunctive.instance,'!|',ProductionExpressionConjunctive.instance],
					];
				}
			}
		
			export class ProductionExpressionDisjunctive_Dynamic extends Production {
				static readonly instance: ProductionExpressionDisjunctive_Dynamic = new ProductionExpressionDisjunctive_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionConjunctive_Dynamic.instance],[ProductionExpressionDisjunctive_Dynamic.instance,'||',ProductionExpressionConjunctive_Dynamic.instance],[ProductionExpressionDisjunctive_Dynamic.instance,'!|',ProductionExpressionConjunctive_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpressionConditional extends Production {
				static readonly instance: ProductionExpressionConditional = new ProductionExpressionConditional();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['if',ProductionExpression.instance,'then',ProductionExpression.instance,'else',ProductionExpression.instance],
					];
				}
			}
		
			export class ProductionExpressionConditional_Dynamic extends Production {
				static readonly instance: ProductionExpressionConditional_Dynamic = new ProductionExpressionConditional_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['if',ProductionExpression_Dynamic.instance,'then',ProductionExpression_Dynamic.instance,'else',ProductionExpression_Dynamic.instance],
					];
				}
			}
		
			export class ProductionExpression extends Production {
				static readonly instance: ProductionExpression = new ProductionExpression();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionDisjunctive.instance],[ProductionExpressionConditional.instance],
					];
				}
			}
		
			export class ProductionExpression_Dynamic extends Production {
				static readonly instance: ProductionExpression_Dynamic = new ProductionExpression_Dynamic();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionDisjunctive_Dynamic.instance],[ProductionExpressionConditional_Dynamic.instance],
					];
				}
			}
		
			export class ProductionDeclarationVariable extends Production {
				static readonly instance: ProductionDeclarationVariable = new ProductionDeclarationVariable();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['let',TERMINAL.TerminalIdentifier.instance,':',ProductionType.instance,'=',ProductionExpression_Dynamic.instance,';'],['let','unfixed',TERMINAL.TerminalIdentifier.instance,':',ProductionType.instance,'=',ProductionExpression_Dynamic.instance,';'],
					];
				}
			}
		
			export class ProductionStatementAssignment extends Production {
				static readonly instance: ProductionStatementAssignment = new ProductionStatementAssignment();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalIdentifier.instance,'=',ProductionExpression_Dynamic.instance,';'],
					];
				}
			}
		
			export class ProductionStatement extends Production {
				static readonly instance: ProductionStatement = new ProductionStatement();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[';'],[ProductionExpression_Dynamic.instance,';'],[ProductionDeclarationVariable.instance],[ProductionStatementAssignment.instance],
					];
				}
			}
		
			export class ProductionGoal__0__List extends Production {
				static readonly instance: ProductionGoal__0__List = new ProductionGoal__0__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionStatement.instance],[ProductionGoal__0__List.instance,ProductionStatement.instance],
					];
				}
			}
		
			export class ProductionGoal extends Production {
				static readonly instance: ProductionGoal = new ProductionGoal();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['\u0002','\u0003'],['\u0002',ProductionGoal__0__List.instance,'\u0003'],
					];
				}
			}
		
		
			export class ParseNodePrimitiveLiteral extends ParseNode {
				declare children:
					readonly [Token] | readonly [Token] | readonly [Token] | readonly [Token] | readonly [Token] | readonly [Token]
				;
			}
		
			export class ParseNodeTypeKeyword extends ParseNode {
				declare children:
					readonly [Token] | readonly [Token] | readonly [Token] | readonly [Token]
				;
			}
		
			export class ParseNodeTypeUnit extends ParseNode {
				declare children:
					readonly [ParseNodePrimitiveLiteral] | readonly [ParseNodeTypeKeyword] | readonly [Token,ParseNodeType,Token]
				;
			}
		
			export class ParseNodeTypeUnarySymbol extends ParseNode {
				declare children:
					readonly [ParseNodeTypeUnit] | readonly [ParseNodeTypeUnarySymbol,Token]
				;
			}
		
			export class ParseNodeTypeIntersection extends ParseNode {
				declare children:
					readonly [ParseNodeTypeUnarySymbol] | readonly [ParseNodeTypeIntersection,Token,ParseNodeTypeUnarySymbol]
				;
			}
		
			export class ParseNodeTypeUnion extends ParseNode {
				declare children:
					readonly [ParseNodeTypeIntersection] | readonly [ParseNodeTypeUnion,Token,ParseNodeTypeIntersection]
				;
			}
		
			export class ParseNodeType extends ParseNode {
				declare children:
					readonly [ParseNodeTypeUnion]
				;
			}
		
			export class ParseNodeStringTemplate__1__List extends ParseNode {
				declare children:
					readonly [Token] | readonly [ParseNodeStringTemplate__1__List,Token] | readonly [Token,ParseNodeExpression] | readonly [ParseNodeStringTemplate__1__List,Token,ParseNodeExpression]
				;
			}
		
			export class ParseNodeStringTemplate_Dynamic__1__List extends ParseNode {
				declare children:
					readonly [Token] | readonly [ParseNodeStringTemplate_Dynamic__1__List,Token] | readonly [Token,ParseNodeExpression_Dynamic] | readonly [ParseNodeStringTemplate_Dynamic__1__List,Token,ParseNodeExpression_Dynamic]
				;
			}
		
			export class ParseNodeStringTemplate extends ParseNode {
				declare children:
					readonly [Token] | readonly [Token,Token] | readonly [Token,ParseNodeStringTemplate__1__List,Token] | readonly [Token,ParseNodeExpression,Token] | readonly [Token,ParseNodeExpression,ParseNodeStringTemplate__1__List,Token]
				;
			}
		
			export class ParseNodeStringTemplate_Dynamic extends ParseNode {
				declare children:
					readonly [Token] | readonly [Token,Token] | readonly [Token,ParseNodeStringTemplate_Dynamic__1__List,Token] | readonly [Token,ParseNodeExpression_Dynamic,Token] | readonly [Token,ParseNodeExpression_Dynamic,ParseNodeStringTemplate_Dynamic__1__List,Token]
				;
			}
		
			export class ParseNodeExpressionUnit extends ParseNode {
				declare children:
					readonly [ParseNodePrimitiveLiteral] | readonly [ParseNodeStringTemplate] | readonly [Token,ParseNodeExpression,Token]
				;
			}
		
			export class ParseNodeExpressionUnit_Dynamic extends ParseNode {
				declare children:
					readonly [Token] | readonly [ParseNodePrimitiveLiteral] | readonly [ParseNodeStringTemplate_Dynamic] | readonly [Token,ParseNodeExpression_Dynamic,Token]
				;
			}
		
			export class ParseNodeExpressionUnarySymbol extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionUnit] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol]
				;
			}
		
			export class ParseNodeExpressionUnarySymbol_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionUnit_Dynamic] | readonly [Token,ParseNodeExpressionUnarySymbol_Dynamic] | readonly [Token,ParseNodeExpressionUnarySymbol_Dynamic] | readonly [Token,ParseNodeExpressionUnarySymbol_Dynamic] | readonly [Token,ParseNodeExpressionUnarySymbol_Dynamic]
				;
			}
		
			export class ParseNodeExpressionExponential extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionUnarySymbol] | readonly [ParseNodeExpressionUnarySymbol,Token,ParseNodeExpressionExponential]
				;
			}
		
			export class ParseNodeExpressionExponential_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionUnarySymbol_Dynamic] | readonly [ParseNodeExpressionUnarySymbol_Dynamic,Token,ParseNodeExpressionExponential_Dynamic]
				;
			}
		
			export class ParseNodeExpressionMultiplicative extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionExponential] | readonly [ParseNodeExpressionMultiplicative,Token,ParseNodeExpressionExponential] | readonly [ParseNodeExpressionMultiplicative,Token,ParseNodeExpressionExponential]
				;
			}
		
			export class ParseNodeExpressionMultiplicative_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionExponential_Dynamic] | readonly [ParseNodeExpressionMultiplicative_Dynamic,Token,ParseNodeExpressionExponential_Dynamic] | readonly [ParseNodeExpressionMultiplicative_Dynamic,Token,ParseNodeExpressionExponential_Dynamic]
				;
			}
		
			export class ParseNodeExpressionAdditive extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionMultiplicative] | readonly [ParseNodeExpressionAdditive,Token,ParseNodeExpressionMultiplicative] | readonly [ParseNodeExpressionAdditive,Token,ParseNodeExpressionMultiplicative]
				;
			}
		
			export class ParseNodeExpressionAdditive_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionMultiplicative_Dynamic] | readonly [ParseNodeExpressionAdditive_Dynamic,Token,ParseNodeExpressionMultiplicative_Dynamic] | readonly [ParseNodeExpressionAdditive_Dynamic,Token,ParseNodeExpressionMultiplicative_Dynamic]
				;
			}
		
			export class ParseNodeExpressionComparative extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive]
				;
			}
		
			export class ParseNodeExpressionComparative_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionAdditive_Dynamic] | readonly [ParseNodeExpressionComparative_Dynamic,Token,ParseNodeExpressionAdditive_Dynamic] | readonly [ParseNodeExpressionComparative_Dynamic,Token,ParseNodeExpressionAdditive_Dynamic] | readonly [ParseNodeExpressionComparative_Dynamic,Token,ParseNodeExpressionAdditive_Dynamic] | readonly [ParseNodeExpressionComparative_Dynamic,Token,ParseNodeExpressionAdditive_Dynamic] | readonly [ParseNodeExpressionComparative_Dynamic,Token,ParseNodeExpressionAdditive_Dynamic] | readonly [ParseNodeExpressionComparative_Dynamic,Token,ParseNodeExpressionAdditive_Dynamic]
				;
			}
		
			export class ParseNodeExpressionEquality extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative]
				;
			}
		
			export class ParseNodeExpressionEquality_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionComparative_Dynamic] | readonly [ParseNodeExpressionEquality_Dynamic,Token,ParseNodeExpressionComparative_Dynamic] | readonly [ParseNodeExpressionEquality_Dynamic,Token,ParseNodeExpressionComparative_Dynamic] | readonly [ParseNodeExpressionEquality_Dynamic,Token,ParseNodeExpressionComparative_Dynamic] | readonly [ParseNodeExpressionEquality_Dynamic,Token,ParseNodeExpressionComparative_Dynamic]
				;
			}
		
			export class ParseNodeExpressionConjunctive extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionEquality] | readonly [ParseNodeExpressionConjunctive,Token,ParseNodeExpressionEquality] | readonly [ParseNodeExpressionConjunctive,Token,ParseNodeExpressionEquality]
				;
			}
		
			export class ParseNodeExpressionConjunctive_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionEquality_Dynamic] | readonly [ParseNodeExpressionConjunctive_Dynamic,Token,ParseNodeExpressionEquality_Dynamic] | readonly [ParseNodeExpressionConjunctive_Dynamic,Token,ParseNodeExpressionEquality_Dynamic]
				;
			}
		
			export class ParseNodeExpressionDisjunctive extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionConjunctive] | readonly [ParseNodeExpressionDisjunctive,Token,ParseNodeExpressionConjunctive] | readonly [ParseNodeExpressionDisjunctive,Token,ParseNodeExpressionConjunctive]
				;
			}
		
			export class ParseNodeExpressionDisjunctive_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionConjunctive_Dynamic] | readonly [ParseNodeExpressionDisjunctive_Dynamic,Token,ParseNodeExpressionConjunctive_Dynamic] | readonly [ParseNodeExpressionDisjunctive_Dynamic,Token,ParseNodeExpressionConjunctive_Dynamic]
				;
			}
		
			export class ParseNodeExpressionConditional extends ParseNode {
				declare children:
					readonly [Token,ParseNodeExpression,Token,ParseNodeExpression,Token,ParseNodeExpression]
				;
			}
		
			export class ParseNodeExpressionConditional_Dynamic extends ParseNode {
				declare children:
					readonly [Token,ParseNodeExpression_Dynamic,Token,ParseNodeExpression_Dynamic,Token,ParseNodeExpression_Dynamic]
				;
			}
		
			export class ParseNodeExpression extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionDisjunctive] | readonly [ParseNodeExpressionConditional]
				;
			}
		
			export class ParseNodeExpression_Dynamic extends ParseNode {
				declare children:
					readonly [ParseNodeExpressionDisjunctive_Dynamic] | readonly [ParseNodeExpressionConditional_Dynamic]
				;
			}
		
			export class ParseNodeDeclarationVariable extends ParseNode {
				declare children:
					readonly [Token,Token,Token,ParseNodeType,Token,ParseNodeExpression_Dynamic,Token] | readonly [Token,Token,Token,Token,ParseNodeType,Token,ParseNodeExpression_Dynamic,Token]
				;
			}
		
			export class ParseNodeStatementAssignment extends ParseNode {
				declare children:
					readonly [Token,Token,ParseNodeExpression_Dynamic,Token]
				;
			}
		
			export class ParseNodeStatement extends ParseNode {
				declare children:
					readonly [Token] | readonly [ParseNodeExpression_Dynamic,Token] | readonly [ParseNodeDeclarationVariable] | readonly [ParseNodeStatementAssignment]
				;
			}
		
			export class ParseNodeGoal__0__List extends ParseNode {
				declare children:
					readonly [ParseNodeStatement] | readonly [ParseNodeGoal__0__List,ParseNodeStatement]
				;
			}
		
			export class ParseNodeGoal extends ParseNode {
				declare children:
					readonly [Token,Token] | readonly [Token,ParseNodeGoal__0__List,Token]
				;
			}
		
		export class ParserSolid extends Parser {
			/**
			 * Construct a new ParserSolid object.
			 * @param source the source text to parse
			 */
			constructor (source: string, config: SolidConfig = CONFIG_DEFAULT) {
				super(new LexerSolid(source, config), new Grammar([
					ProductionPrimitiveLiteral.instance,ProductionTypeKeyword.instance,ProductionTypeUnit.instance,ProductionTypeUnarySymbol.instance,ProductionTypeIntersection.instance,ProductionTypeUnion.instance,ProductionType.instance,ProductionStringTemplate__1__List.instance,ProductionStringTemplate_Dynamic__1__List.instance,ProductionStringTemplate.instance,ProductionStringTemplate_Dynamic.instance,ProductionExpressionUnit.instance,ProductionExpressionUnit_Dynamic.instance,ProductionExpressionUnarySymbol.instance,ProductionExpressionUnarySymbol_Dynamic.instance,ProductionExpressionExponential.instance,ProductionExpressionExponential_Dynamic.instance,ProductionExpressionMultiplicative.instance,ProductionExpressionMultiplicative_Dynamic.instance,ProductionExpressionAdditive.instance,ProductionExpressionAdditive_Dynamic.instance,ProductionExpressionComparative.instance,ProductionExpressionComparative_Dynamic.instance,ProductionExpressionEquality.instance,ProductionExpressionEquality_Dynamic.instance,ProductionExpressionConjunctive.instance,ProductionExpressionConjunctive_Dynamic.instance,ProductionExpressionDisjunctive.instance,ProductionExpressionDisjunctive_Dynamic.instance,ProductionExpressionConditional.instance,ProductionExpressionConditional_Dynamic.instance,ProductionExpression.instance,ProductionExpression_Dynamic.instance,ProductionDeclarationVariable.instance,ProductionStatementAssignment.instance,ProductionStatement.instance,ProductionGoal__0__List.instance,ProductionGoal.instance,
				], ProductionGoal.instance), new Map<Production, typeof ParseNode>([
					[ProductionPrimitiveLiteral.instance, ParseNodePrimitiveLiteral],[ProductionTypeKeyword.instance, ParseNodeTypeKeyword],[ProductionTypeUnit.instance, ParseNodeTypeUnit],[ProductionTypeUnarySymbol.instance, ParseNodeTypeUnarySymbol],[ProductionTypeIntersection.instance, ParseNodeTypeIntersection],[ProductionTypeUnion.instance, ParseNodeTypeUnion],[ProductionType.instance, ParseNodeType],[ProductionStringTemplate__1__List.instance, ParseNodeStringTemplate__1__List],[ProductionStringTemplate_Dynamic__1__List.instance, ParseNodeStringTemplate_Dynamic__1__List],[ProductionStringTemplate.instance, ParseNodeStringTemplate],[ProductionStringTemplate_Dynamic.instance, ParseNodeStringTemplate_Dynamic],[ProductionExpressionUnit.instance, ParseNodeExpressionUnit],[ProductionExpressionUnit_Dynamic.instance, ParseNodeExpressionUnit_Dynamic],[ProductionExpressionUnarySymbol.instance, ParseNodeExpressionUnarySymbol],[ProductionExpressionUnarySymbol_Dynamic.instance, ParseNodeExpressionUnarySymbol_Dynamic],[ProductionExpressionExponential.instance, ParseNodeExpressionExponential],[ProductionExpressionExponential_Dynamic.instance, ParseNodeExpressionExponential_Dynamic],[ProductionExpressionMultiplicative.instance, ParseNodeExpressionMultiplicative],[ProductionExpressionMultiplicative_Dynamic.instance, ParseNodeExpressionMultiplicative_Dynamic],[ProductionExpressionAdditive.instance, ParseNodeExpressionAdditive],[ProductionExpressionAdditive_Dynamic.instance, ParseNodeExpressionAdditive_Dynamic],[ProductionExpressionComparative.instance, ParseNodeExpressionComparative],[ProductionExpressionComparative_Dynamic.instance, ParseNodeExpressionComparative_Dynamic],[ProductionExpressionEquality.instance, ParseNodeExpressionEquality],[ProductionExpressionEquality_Dynamic.instance, ParseNodeExpressionEquality_Dynamic],[ProductionExpressionConjunctive.instance, ParseNodeExpressionConjunctive],[ProductionExpressionConjunctive_Dynamic.instance, ParseNodeExpressionConjunctive_Dynamic],[ProductionExpressionDisjunctive.instance, ParseNodeExpressionDisjunctive],[ProductionExpressionDisjunctive_Dynamic.instance, ParseNodeExpressionDisjunctive_Dynamic],[ProductionExpressionConditional.instance, ParseNodeExpressionConditional],[ProductionExpressionConditional_Dynamic.instance, ParseNodeExpressionConditional_Dynamic],[ProductionExpression.instance, ParseNodeExpression],[ProductionExpression_Dynamic.instance, ParseNodeExpression_Dynamic],[ProductionDeclarationVariable.instance, ParseNodeDeclarationVariable],[ProductionStatementAssignment.instance, ParseNodeStatementAssignment],[ProductionStatement.instance, ParseNodeStatement],[ProductionGoal__0__List.instance, ParseNodeGoal__0__List],[ProductionGoal.instance, ParseNodeGoal],
				]));
			}
			// @ts-expect-error
			declare parse(): ParseNodeGoal;
		}
	
	