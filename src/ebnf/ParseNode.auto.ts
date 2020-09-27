
			
			/*----------------------------------------------------------------/
			| WARNING: Do not manually update this file!
			| It is auto-generated via
			| </src/parser/ParseNode.class.ts#ParseNode#fromJSON>.
			| If you need to make updates, make them there.
			/----------------------------------------------------------------*/
		
			
			import type Token from '../lexer/Token.class';
			import {ParseNode} from '../parser/ParseNode.class';
			
				export class ParseNodeNonterminalDefinition extends ParseNode {
					declare children:
						readonly [Token] | readonly [Token,Token,ParseNodeIdentifier__CSL,Token]
					;
				}
			
				export class ParseNodeIdentifier__CSL extends ParseNode {
					declare children:
						readonly [Token] | readonly [ParseNodeIdentifier__CSL,Token,Token]
					;
				}
			
				export class ParseNodeNonterminalReference extends ParseNode {
					declare children:
						readonly [Token] | readonly [Token,Token,ParseNodeNonterminalReference__0__CSL,Token]
					;
				}
			
				export class ParseNodeNonterminalReference__0__CSL extends ParseNode {
					declare children:
						readonly [Token,Token] | readonly [Token,Token] | readonly [Token,Token] | readonly [ParseNodeNonterminalReference__0__CSL,Token,Token,Token] | readonly [ParseNodeNonterminalReference__0__CSL,Token,Token,Token] | readonly [ParseNodeNonterminalReference__0__CSL,Token,Token,Token]
					;
				}
			
				export class ParseNodeCondition extends ParseNode {
					declare children:
						readonly [Token,ParseNodeCondition__0__CSL,Token]
					;
				}
			
				export class ParseNodeCondition__0__CSL extends ParseNode {
					declare children:
						readonly [Token,Token] | readonly [Token,Token] | readonly [ParseNodeCondition__0__CSL,Token,Token,Token] | readonly [ParseNodeCondition__0__CSL,Token,Token,Token]
					;
				}
			
				export class ParseNodeUnit extends ParseNode {
					declare children:
						readonly [Token] | readonly [Token] | readonly [Token] | readonly [ParseNodeNonterminalReference] | readonly [Token,ParseNodeAltern,Token]
					;
				}
			
				export class ParseNodeUnary extends ParseNode {
					declare children:
						readonly [ParseNodeUnit] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token,Token] | readonly [ParseNodeUnit,Token,Token] | readonly [ParseNodeUnit,Token,Token]
					;
				}
			
				export class ParseNodeItem extends ParseNode {
					declare children:
						readonly [ParseNodeUnary] | readonly [ParseNodeCondition,ParseNodeItem]
					;
				}
			
				export class ParseNodeItem__List extends ParseNode {
					declare children:
						readonly [ParseNodeItem] | readonly [ParseNodeItem__List,ParseNodeItem]
					;
				}
			
				export class ParseNodeConcat extends ParseNode {
					declare children:
						readonly [ParseNodeItem__List] | readonly [ParseNodeConcat,Token,ParseNodeItem__List]
					;
				}
			
				export class ParseNodeAltern extends ParseNode {
					declare children:
						readonly [ParseNodeConcat] | readonly [ParseNodeAltern,Token,ParseNodeConcat]
					;
				}
			
				export class ParseNodeProduction extends ParseNode {
					declare children:
						readonly [ParseNodeNonterminalDefinition,Token,ParseNodeAltern,Token] | readonly [ParseNodeNonterminalDefinition,Token,ParseNodeAltern,Token] | readonly [ParseNodeNonterminalDefinition,Token,Token,ParseNodeAltern,Token] | readonly [ParseNodeNonterminalDefinition,Token,Token,ParseNodeAltern,Token]
					;
				}
			
				export class ParseNodeGrammar extends ParseNode {
					declare children:
						readonly [Token,Token] | readonly [Token,ParseNodeProduction__List,Token]
					;
				}
			
				export class ParseNodeProduction__List extends ParseNode {
					declare children:
						readonly [ParseNodeProduction] | readonly [ParseNodeProduction__List,ParseNodeProduction]
					;
				}
			
		
		