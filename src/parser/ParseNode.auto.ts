
			
			/*----------------------------------------------------------------/
			| WARNING: Do not manually update this file!
			| It is auto-generated via
			| </src/parser/ParseNode.class.ts#ParseNode#fromJSON>.
			| If you need to make updates, make them there.
			/----------------------------------------------------------------*/
		
			
			import type Token from '../lexer/Token.class';
			import {ParseNode} from '../parser/ParseNode.class';
			
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
						readonly [Token] | readonly [Token,ParseNodeExpression] | readonly [ParseNodeStringTemplate__1__List,Token] | readonly [ParseNodeStringTemplate__1__List,Token,ParseNodeExpression]
					;
				}
			
				export class ParseNodeStringTemplate extends ParseNode {
					declare children:
						readonly [Token] | readonly [Token,Token] | readonly [Token,ParseNodeExpression,Token] | readonly [Token,ParseNodeStringTemplate__1__List,Token] | readonly [Token,ParseNodeExpression,ParseNodeStringTemplate__1__List,Token]
					;
				}
			
				export class ParseNodeExpressionUnit extends ParseNode {
					declare children:
						readonly [Token] | readonly [ParseNodePrimitiveLiteral] | readonly [ParseNodeStringTemplate] | readonly [Token,ParseNodeExpression,Token]
					;
				}
			
				export class ParseNodeExpressionUnarySymbol extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionUnit] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol] | readonly [Token,ParseNodeExpressionUnarySymbol]
					;
				}
			
				export class ParseNodeExpressionExponential extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionUnarySymbol] | readonly [ParseNodeExpressionUnarySymbol,Token,ParseNodeExpressionExponential]
					;
				}
			
				export class ParseNodeExpressionMultiplicative extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionExponential] | readonly [ParseNodeExpressionMultiplicative,Token,ParseNodeExpressionExponential] | readonly [ParseNodeExpressionMultiplicative,Token,ParseNodeExpressionExponential]
					;
				}
			
				export class ParseNodeExpressionAdditive extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionMultiplicative] | readonly [ParseNodeExpressionAdditive,Token,ParseNodeExpressionMultiplicative] | readonly [ParseNodeExpressionAdditive,Token,ParseNodeExpressionMultiplicative]
					;
				}
			
				export class ParseNodeExpressionComparative extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive] | readonly [ParseNodeExpressionComparative,Token,ParseNodeExpressionAdditive]
					;
				}
			
				export class ParseNodeExpressionEquality extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative] | readonly [ParseNodeExpressionEquality,Token,ParseNodeExpressionComparative]
					;
				}
			
				export class ParseNodeExpressionConjunctive extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionEquality] | readonly [ParseNodeExpressionConjunctive,Token,ParseNodeExpressionEquality] | readonly [ParseNodeExpressionConjunctive,Token,ParseNodeExpressionEquality]
					;
				}
			
				export class ParseNodeExpressionDisjunctive extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionConjunctive] | readonly [ParseNodeExpressionDisjunctive,Token,ParseNodeExpressionConjunctive] | readonly [ParseNodeExpressionDisjunctive,Token,ParseNodeExpressionConjunctive]
					;
				}
			
				export class ParseNodeExpressionConditional extends ParseNode {
					declare children:
						readonly [Token,ParseNodeExpression,Token,ParseNodeExpression,Token,ParseNodeExpression]
					;
				}
			
				export class ParseNodeExpression extends ParseNode {
					declare children:
						readonly [ParseNodeExpressionDisjunctive] | readonly [ParseNodeExpressionConditional]
					;
				}
			
				export class ParseNodeDeclarationVariable extends ParseNode {
					declare children:
						readonly [Token,Token,Token,ParseNodeType,Token,ParseNodeExpression,Token] | readonly [Token,Token,Token,Token,ParseNodeType,Token,ParseNodeExpression,Token]
					;
				}
			
				export class ParseNodeStatementAssignment extends ParseNode {
					declare children:
						readonly [Token,Token,ParseNodeExpression,Token]
					;
				}
			
				export class ParseNodeStatement extends ParseNode {
					declare children:
						readonly [Token] | readonly [ParseNodeExpression,Token] | readonly [ParseNodeDeclarationVariable] | readonly [ParseNodeStatementAssignment]
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
			
		
		