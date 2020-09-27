
			
			/*----------------------------------------------------------------/
			| WARNING: Do not manually update this file!
			| It is auto-generated via
			| </src/parser/ParseNode.class.ts#ParseNode#fromJSON>.
			| If you need to make updates, make them there.
			/----------------------------------------------------------------*/
		
			
			import type Token from '../lexer/Token.class';
			import {ParseNode} from '../parser/ParseNode.class';
			
				export class ParseNodeNonterminalName extends ParseNode {
					declare children:
						readonly [Token] | readonly [Token,Token,ParseNodeIdentifier__CSL,Token]
					;
				}
			
				export class ParseNodeIdentifier__CSL extends ParseNode {
					declare children:
						readonly [Token] | readonly [ParseNodeIdentifier__CSL,Token,Token]
					;
				}
			
				export class ParseNodeNonterminalRef extends ParseNode {
					declare children:
						readonly [Token] | readonly [Token,Token,ParseNodeNonterminalRef__0__CSL,Token]
					;
				}
			
				export class ParseNodeNonterminalRef__0__CSL extends ParseNode {
					declare children:
						readonly [Token,Token] | readonly [Token,Token] | readonly [Token,Token] | readonly [ParseNodeNonterminalRef__0__CSL,Token,Token,Token] | readonly [ParseNodeNonterminalRef__0__CSL,Token,Token,Token] | readonly [ParseNodeNonterminalRef__0__CSL,Token,Token,Token]
					;
				}
			
				export class ParseNodeConditionSet extends ParseNode {
					declare children:
						readonly [Token,ParseNodeConditionSet__0__CSL,Token]
					;
				}
			
				export class ParseNodeConditionSet__0__CSL extends ParseNode {
					declare children:
						readonly [Token,Token] | readonly [Token,Token] | readonly [ParseNodeConditionSet__0__CSL,Token,Token,Token] | readonly [ParseNodeConditionSet__0__CSL,Token,Token,Token]
					;
				}
			
				export class ParseNodeUnit extends ParseNode {
					declare children:
						readonly [Token] | readonly [Token] | readonly [Token] | readonly [ParseNodeNonterminalRef] | readonly [Token,ParseNodeDefinition,Token]
					;
				}
			
				export class ParseNodeUnary extends ParseNode {
					declare children:
						readonly [ParseNodeUnit] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token,Token] | readonly [ParseNodeUnit,Token,Token] | readonly [ParseNodeUnit,Token,Token]
					;
				}
			
				export class ParseNodeItem extends ParseNode {
					declare children:
						readonly [ParseNodeUnary] | readonly [ParseNodeConditionSet,ParseNodeItem]
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
			
				export class ParseNodeDefinition extends ParseNode {
					declare children:
						readonly [ParseNodeAltern]
					;
				}
			
				export class ParseNodeProduction extends ParseNode {
					declare children:
						readonly [ParseNodeNonterminalName,Token,ParseNodeDefinition,Token] | readonly [ParseNodeNonterminalName,Token,ParseNodeDefinition,Token] | readonly [ParseNodeNonterminalName,Token,Token,ParseNodeDefinition,Token] | readonly [ParseNodeNonterminalName,Token,Token,ParseNodeDefinition,Token]
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
			
		
		