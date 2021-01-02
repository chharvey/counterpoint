
		/*----------------------------------------------------------------/
		| WARNING: Do not manually update this file!
		| It is auto-generated via <@chharvey/parser>.
		| If you need to make updates, make them there.
		/----------------------------------------------------------------*/
		import {
			SolidConfig,
			CONFIG_DEFAULT,
		} from '../core/';
		
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
		
			export class ProductionWord extends Production {
				static readonly instance: ProductionWord = new ProductionWord();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalKeyword.instance],[TERMINAL.TerminalIdentifier.instance],
					];
				}
			}
		
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
						[TERMINAL.TerminalIdentifier.instance],[ProductionPrimitiveLiteral.instance],[ProductionTypeKeyword.instance],['(',ProductionType.instance,')'],
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
		
			export class ProductionStringTemplate extends Production {
				static readonly instance: ProductionStringTemplate = new ProductionStringTemplate();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalTemplateFull.instance],[TERMINAL.TerminalTemplateHead.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionExpression.instance,TERMINAL.TerminalTemplateTail.instance],[TERMINAL.TerminalTemplateHead.instance,ProductionExpression.instance,ProductionStringTemplate__1__List.instance,TERMINAL.TerminalTemplateTail.instance],
					];
				}
			}
		
			export class ProductionExpressionHash__0__List extends Production {
				static readonly instance: ProductionExpressionHash__0__List = new ProductionExpressionHash__0__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpression.instance],[ProductionExpressionHash__0__List.instance,',',ProductionExpression.instance],
					];
				}
			}
		
			export class ProductionExpressionHash extends Production {
				static readonly instance: ProductionExpressionHash = new ProductionExpressionHash();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionHash__0__List.instance],
					];
				}
			}
		
			export class ProductionProperty extends Production {
				static readonly instance: ProductionProperty = new ProductionProperty();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionWord.instance,'=',ProductionExpression.instance],
					];
				}
			}
		
			export class ProductionCase extends Production {
				static readonly instance: ProductionCase = new ProductionCase();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionHash.instance,'|->',ProductionExpression.instance],
					];
				}
			}
		
			export class ProductionListLiteral extends Production {
				static readonly instance: ProductionListLiteral = new ProductionListLiteral();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['[',ProductionExpressionHash.instance,']'],['[',ProductionExpressionHash.instance,',',']'],['[',',',ProductionExpressionHash.instance,']'],['[',',',ProductionExpressionHash.instance,',',']'],
					];
				}
			}
		
			export class ProductionRecordLiteral__1__List extends Production {
				static readonly instance: ProductionRecordLiteral__1__List = new ProductionRecordLiteral__1__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionProperty.instance],[ProductionRecordLiteral__1__List.instance,',',ProductionProperty.instance],
					];
				}
			}
		
			export class ProductionRecordLiteral extends Production {
				static readonly instance: ProductionRecordLiteral = new ProductionRecordLiteral();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['[',ProductionRecordLiteral__1__List.instance,']'],['[',ProductionRecordLiteral__1__List.instance,',',']'],['[',',',ProductionRecordLiteral__1__List.instance,']'],['[',',',ProductionRecordLiteral__1__List.instance,',',']'],
					];
				}
			}
		
			export class ProductionMapLiteral__1__List extends Production {
				static readonly instance: ProductionMapLiteral__1__List = new ProductionMapLiteral__1__List();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionCase.instance],[ProductionMapLiteral__1__List.instance,',',ProductionCase.instance],
					];
				}
			}
		
			export class ProductionMapLiteral extends Production {
				static readonly instance: ProductionMapLiteral = new ProductionMapLiteral();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['[',ProductionMapLiteral__1__List.instance,']'],['[',ProductionMapLiteral__1__List.instance,',',']'],['[',',',ProductionMapLiteral__1__List.instance,']'],['[',',',ProductionMapLiteral__1__List.instance,',',']'],
					];
				}
			}
		
			export class ProductionExpressionUnit extends Production {
				static readonly instance: ProductionExpressionUnit = new ProductionExpressionUnit();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['[',']'],[TERMINAL.TerminalIdentifier.instance],[ProductionPrimitiveLiteral.instance],[ProductionStringTemplate.instance],[ProductionListLiteral.instance],[ProductionRecordLiteral.instance],[ProductionMapLiteral.instance],['(',ProductionExpression.instance,')'],
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
		
			export class ProductionExpressionExponential extends Production {
				static readonly instance: ProductionExpressionExponential = new ProductionExpressionExponential();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionUnarySymbol.instance],[ProductionExpressionUnarySymbol.instance,'^',ProductionExpressionExponential.instance],
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
		
			export class ProductionExpressionAdditive extends Production {
				static readonly instance: ProductionExpressionAdditive = new ProductionExpressionAdditive();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionMultiplicative.instance],[ProductionExpressionAdditive.instance,'+',ProductionExpressionMultiplicative.instance],[ProductionExpressionAdditive.instance,'-',ProductionExpressionMultiplicative.instance],
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
		
			export class ProductionExpressionEquality extends Production {
				static readonly instance: ProductionExpressionEquality = new ProductionExpressionEquality();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,'is',ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,'isnt',ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,'==',ProductionExpressionComparative.instance],[ProductionExpressionEquality.instance,'!=',ProductionExpressionComparative.instance],
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
		
			export class ProductionExpressionDisjunctive extends Production {
				static readonly instance: ProductionExpressionDisjunctive = new ProductionExpressionDisjunctive();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionConjunctive.instance],[ProductionExpressionDisjunctive.instance,'||',ProductionExpressionConjunctive.instance],[ProductionExpressionDisjunctive.instance,'!|',ProductionExpressionConjunctive.instance],
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
		
			export class ProductionExpression extends Production {
				static readonly instance: ProductionExpression = new ProductionExpression();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionExpressionDisjunctive.instance],[ProductionExpressionConditional.instance],
					];
				}
			}
		
			export class ProductionDeclarationVariable extends Production {
				static readonly instance: ProductionDeclarationVariable = new ProductionDeclarationVariable();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['let',TERMINAL.TerminalIdentifier.instance,':',ProductionType.instance,'=',ProductionExpression.instance,';'],['let','unfixed',TERMINAL.TerminalIdentifier.instance,':',ProductionType.instance,'=',ProductionExpression.instance,';'],
					];
				}
			}
		
			export class ProductionDeclarationType extends Production {
				static readonly instance: ProductionDeclarationType = new ProductionDeclarationType();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						['type',TERMINAL.TerminalIdentifier.instance,'=',ProductionType.instance,';'],
					];
				}
			}
		
			export class ProductionDeclaration extends Production {
				static readonly instance: ProductionDeclaration = new ProductionDeclaration();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[ProductionDeclarationVariable.instance],[ProductionDeclarationType.instance],
					];
				}
			}
		
			export class ProductionStatementAssignment extends Production {
				static readonly instance: ProductionStatementAssignment = new ProductionStatementAssignment();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[TERMINAL.TerminalIdentifier.instance,'=',ProductionExpression.instance,';'],
					];
				}
			}
		
			export class ProductionStatement extends Production {
				static readonly instance: ProductionStatement = new ProductionStatement();
				/** @implements Production */
				get sequences(): NonemptyArray<NonemptyArray<GrammarSymbol>> {
					return [
						[';'],[ProductionExpression.instance,';'],[ProductionDeclaration.instance],[ProductionStatementAssignment.instance],
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
		
		
			export class ParseNodeWord extends ParseNode {
				declare readonly children:
					readonly [Token] | readonly [Token]
				;
			}
		
			export class ParseNodePrimitiveLiteral extends ParseNode {
				declare readonly children:
					readonly [Token] | readonly [Token] | readonly [Token] | readonly [Token] | readonly [Token] | readonly [Token]
				;
			}
		
			export class ParseNodeTypeKeyword extends ParseNode {
				declare readonly children:
					readonly [Token] | readonly [Token] | readonly [Token] | readonly [Token]
				;
			}
		
			export class ParseNodeTypeUnit extends ParseNode {
				declare readonly children:
					readonly [Token] | readonly [ParseNodePrimitiveLiteral] | readonly [ParseNodeTypeKeyword] | readonly [Token,ParseNodeType,Token]
				;
			}
		
			export class ParseNodeTypeUnarySymbol extends ParseNode {
				declare readonly children:
					readonly [ParseNodeTypeUnit] | readonly [ParseNodeTypeUnarySymbol,Token]
				;
			}
		
			export class ParseNodeTypeIntersection extends ParseNode {
				declare readonly children:
					readonly [ParseNodeTypeUnarySymbol] | readonly [ParseNodeTypeIntersection,Token,ParseNodeTypeUnarySymbol]
				;
			}
		
			export class ParseNodeTypeUnion extends ParseNode {
				declare readonly children:
					readonly [ParseNodeTypeIntersection] | readonly [ParseNodeTypeUnion,Token,ParseNodeTypeIntersection]
				;
			}
		
			export class ParseNodeType extends ParseNode {
				declare readonly children:
					readonly [ParseNodeTypeUnion]
				;
			}
		
			export class ParseNodeStringTemplate__1__List extends ParseNode {
				declare readonly children:
					readonly [Token] | readonly [ParseNodeStringTemplate__1__List,Token] | readonly [Token,ParseNodeExpression] | readonly [ParseNodeStringTemplate__1__List,Token,ParseNodeExpression]
				;
			}
		
			export class ParseNodeStringTemplate extends ParseNode {
				declare readonly children:
					readonly [Token] | readonly [Token,Token] | readonly [Token,ParseNodeStringTemplate__1__List,Token] | readonly [Token,ParseNodeExpression,Token] | readonly [Token,ParseNodeExpression,ParseNodeStringTemplate__1__List,Token]
				;
			}
		
			export class ParseNodeExpressionHash__0__List extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpression] | readonly [ParseNodeExpressionHash__0__List,Token,ParseNodeExpression]
				;
			}
		
			export class ParseNodeExpressionHash extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionHash__0__List]
				;
			}
		
			export class ParseNodeProperty extends ParseNode {
				declare readonly children:
					readonly [ParseNodeWord,Token,ParseNodeExpression]
				;
			}
		
			export class ParseNodeCase extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionHash,Token,ParseNodeExpression]
				;
			}
		
			export class ParseNodeListLiteral extends ParseNode {
				declare readonly children:
					readonly [Token,ParseNodeExpressionHash,Token] | readonly [Token,ParseNodeExpressionHash,Token,Token] | readonly [Token,Token,ParseNodeExpressionHash,Token] | readonly [Token,Token,ParseNodeExpressionHash,Token,Token]
				;
			}
		
			export class ParseNodeRecordLiteral__1__List extends ParseNode {
				declare readonly children:
					readonly [ParseNodeProperty] | readonly [ParseNodeRecordLiteral__1__List,Token,ParseNodeProperty]
				;
			}
		
			export class ParseNodeRecordLiteral extends ParseNode {
				declare readonly children:
					readonly [Token,ParseNodeRecordLiteral__1__List,Token] | readonly [Token,ParseNodeRecordLiteral__1__List,Token,Token] | readonly [Token,Token,ParseNodeRecordLiteral__1__List,Token] | readonly [Token,Token,ParseNodeRecordLiteral__1__List,Token,Token]
				;
			}
		
			export class ParseNodeMapLiteral__1__List extends ParseNode {
				declare readonly children:
					readonly [ParseNodeCase] | readonly [ParseNodeMapLiteral__1__List,Token,ParseNodeCase]
				;
			}
		
			export class ParseNodeMapLiteral extends ParseNode {
				declare readonly children:
					readonly [Token,ParseNodeMapLiteral__1__List,Token] | readonly [Token,ParseNodeMapLiteral__1__List,Token,Token] | readonly [Token,Token,ParseNodeMapLiteral__1__List,Token] | readonly [Token,Token,ParseNodeMapLiteral__1__List,Token,Token]
				;
			}
		
			export class ParseNodeExpressionUnit extends ParseNode {
				declare readonly children:
					readonly [Token,Token] | readonly [Token] | readonly [ParseNodePrimitiveLiteral] | readonly [ParseNodeStringTemplate] | readonly [ParseNodeListLiteral] | readonly [ParseNodeRecordLiteral] | readonly [ParseNodeMapLiteral] | readonly [Token,ParseNodeExpression,Token]
				;
			}
		
			export class ParseNodeExpressionUnarySymbol extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionUnit] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol]
				;
			}
		
			export class ParseNodeExpressionExponential extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionUnarySymbol] | readonly [ParseNodeExpressionUnarySymbol,Token,ParseNodeExpressionExponential]
				;
			}
		
			export class ParseNodeExpressionMultiplicative extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionExponential] | readonly [ParseNodeExpressionMultiplicative,Token,ParseNodeExpressionExponential] | readonly [ParseNodeExpressionMultiplicative,Token,ParseNodeExpressionExponential]
				;
			}
		
			export class ParseNodeExpressionAdditive extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionMultiplicative] | readonly [ParseNodeExpressionAdditive,Token,ParseNodeExpressionMultiplicative] | readonly [ParseNodeExpressionAdditive,Token,ParseNodeExpressionMultiplicative]
				;
			}
		
			export class ParseNodeExpressionComparative extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive]
				;
			}
		
			export class ParseNodeExpressionEquality extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative]
				;
			}
		
			export class ParseNodeExpressionConjunctive extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionEquality] | readonly [ParseNodeExpressionConjunctive,Token,ParseNodeExpressionEquality] | readonly [ParseNodeExpressionConjunctive,Token,ParseNodeExpressionEquality]
				;
			}
		
			export class ParseNodeExpressionDisjunctive extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionConjunctive] | readonly [ParseNodeExpressionDisjunctive,Token,ParseNodeExpressionConjunctive] | readonly [ParseNodeExpressionDisjunctive,Token,ParseNodeExpressionConjunctive]
				;
			}
		
			export class ParseNodeExpressionConditional extends ParseNode {
				declare readonly children:
					readonly [Token,ParseNodeExpression,Token,ParseNodeExpression,Token,ParseNodeExpression]
				;
			}
		
			export class ParseNodeExpression extends ParseNode {
				declare readonly children:
					readonly [ParseNodeExpressionDisjunctive] | readonly [ParseNodeExpressionConditional]
				;
			}
		
			export class ParseNodeDeclarationVariable extends ParseNode {
				declare readonly children:
					readonly [Token,Token,Token,ParseNodeType,Token,ParseNodeExpression,Token] | readonly [Token,Token,Token,Token,ParseNodeType,Token,ParseNodeExpression,Token]
				;
			}
		
			export class ParseNodeDeclarationType extends ParseNode {
				declare readonly children:
					readonly [Token,Token,Token,ParseNodeType,Token]
				;
			}
		
			export class ParseNodeDeclaration extends ParseNode {
				declare readonly children:
					readonly [ParseNodeDeclarationVariable] | readonly [ParseNodeDeclarationType]
				;
			}
		
			export class ParseNodeStatementAssignment extends ParseNode {
				declare readonly children:
					readonly [Token,Token,ParseNodeExpression,Token]
				;
			}
		
			export class ParseNodeStatement extends ParseNode {
				declare readonly children:
					readonly [Token] | readonly [ParseNodeExpression,Token] | readonly [ParseNodeDeclaration] | readonly [ParseNodeStatementAssignment]
				;
			}
		
			export class ParseNodeGoal__0__List extends ParseNode {
				declare readonly children:
					readonly [ParseNodeStatement] | readonly [ParseNodeGoal__0__List,ParseNodeStatement]
				;
			}
		
			export class ParseNodeGoal extends ParseNode {
				declare readonly children:
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
					ProductionWord.instance,ProductionPrimitiveLiteral.instance,ProductionTypeKeyword.instance,ProductionTypeUnit.instance,ProductionTypeUnarySymbol.instance,ProductionTypeIntersection.instance,ProductionTypeUnion.instance,ProductionType.instance,ProductionStringTemplate__1__List.instance,ProductionStringTemplate.instance,ProductionExpressionHash__0__List.instance,ProductionExpressionHash.instance,ProductionProperty.instance,ProductionCase.instance,ProductionListLiteral.instance,ProductionRecordLiteral__1__List.instance,ProductionRecordLiteral.instance,ProductionMapLiteral__1__List.instance,ProductionMapLiteral.instance,ProductionExpressionUnit.instance,ProductionExpressionUnarySymbol.instance,ProductionExpressionExponential.instance,ProductionExpressionMultiplicative.instance,ProductionExpressionAdditive.instance,ProductionExpressionComparative.instance,ProductionExpressionEquality.instance,ProductionExpressionConjunctive.instance,ProductionExpressionDisjunctive.instance,ProductionExpressionConditional.instance,ProductionExpression.instance,ProductionDeclarationVariable.instance,ProductionDeclarationType.instance,ProductionDeclaration.instance,ProductionStatementAssignment.instance,ProductionStatement.instance,ProductionGoal__0__List.instance,ProductionGoal.instance,
				], ProductionGoal.instance), new Map<Production, typeof ParseNode>([
					[ProductionWord.instance, ParseNodeWord],[ProductionPrimitiveLiteral.instance, ParseNodePrimitiveLiteral],[ProductionTypeKeyword.instance, ParseNodeTypeKeyword],[ProductionTypeUnit.instance, ParseNodeTypeUnit],[ProductionTypeUnarySymbol.instance, ParseNodeTypeUnarySymbol],[ProductionTypeIntersection.instance, ParseNodeTypeIntersection],[ProductionTypeUnion.instance, ParseNodeTypeUnion],[ProductionType.instance, ParseNodeType],[ProductionStringTemplate__1__List.instance, ParseNodeStringTemplate__1__List],[ProductionStringTemplate.instance, ParseNodeStringTemplate],[ProductionExpressionHash__0__List.instance, ParseNodeExpressionHash__0__List],[ProductionExpressionHash.instance, ParseNodeExpressionHash],[ProductionProperty.instance, ParseNodeProperty],[ProductionCase.instance, ParseNodeCase],[ProductionListLiteral.instance, ParseNodeListLiteral],[ProductionRecordLiteral__1__List.instance, ParseNodeRecordLiteral__1__List],[ProductionRecordLiteral.instance, ParseNodeRecordLiteral],[ProductionMapLiteral__1__List.instance, ParseNodeMapLiteral__1__List],[ProductionMapLiteral.instance, ParseNodeMapLiteral],[ProductionExpressionUnit.instance, ParseNodeExpressionUnit],[ProductionExpressionUnarySymbol.instance, ParseNodeExpressionUnarySymbol],[ProductionExpressionExponential.instance, ParseNodeExpressionExponential],[ProductionExpressionMultiplicative.instance, ParseNodeExpressionMultiplicative],[ProductionExpressionAdditive.instance, ParseNodeExpressionAdditive],[ProductionExpressionComparative.instance, ParseNodeExpressionComparative],[ProductionExpressionEquality.instance, ParseNodeExpressionEquality],[ProductionExpressionConjunctive.instance, ParseNodeExpressionConjunctive],[ProductionExpressionDisjunctive.instance, ParseNodeExpressionDisjunctive],[ProductionExpressionConditional.instance, ParseNodeExpressionConditional],[ProductionExpression.instance, ParseNodeExpression],[ProductionDeclarationVariable.instance, ParseNodeDeclarationVariable],[ProductionDeclarationType.instance, ParseNodeDeclarationType],[ProductionDeclaration.instance, ParseNodeDeclaration],[ProductionStatementAssignment.instance, ParseNodeStatementAssignment],[ProductionStatement.instance, ParseNodeStatement],[ProductionGoal__0__List.instance, ParseNodeGoal__0__List],[ProductionGoal.instance, ParseNodeGoal],
				]));
			}
			// @ts-expect-error
			declare parse(): ParseNodeGoal;
		}
	
	