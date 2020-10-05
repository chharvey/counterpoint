
			
			/*----------------------------------------------------------------/
			| WARNING: Do not manually update this file!
			| It is auto-generated via
			| </src/parser/ParseNode.class.ts#ParseNode#fromJSON>.
			| If you need to make updates, make them there.
			/----------------------------------------------------------------*/
		
			
			import type Token from '../lexer/Token.class';
			import {ParseNode} from '../parser/ParseNode.class';
			
				export class ParseNodeParameterSet__0__List extends ParseNode {
					declare children:
						readonly [Token] | readonly [ParseNodeParameterSet__0__List,Token,Token]
					;
				}
			
				export class ParseNodeParameterSet extends ParseNode {
					declare children:
						readonly [Token,ParseNodeParameterSet__0__List,Token]
					;
				}
			
				export class ParseNodeArgumentSet__0__List extends ParseNode {
					declare children:
						readonly [Token,Token] | readonly [ParseNodeArgumentSet__0__List,Token,Token,Token] | readonly [Token,Token] | readonly [ParseNodeArgumentSet__0__List,Token,Token,Token] | readonly [Token,Token] | readonly [ParseNodeArgumentSet__0__List,Token,Token,Token]
					;
				}
			
				export class ParseNodeArgumentSet extends ParseNode {
					declare children:
						readonly [Token,ParseNodeArgumentSet__0__List,Token]
					;
				}
			
				export class ParseNodeConditionSet__0__List extends ParseNode {
					declare children:
						readonly [Token,Token] | readonly [ParseNodeConditionSet__0__List,Token,Token,Token] | readonly [Token,Token] | readonly [ParseNodeConditionSet__0__List,Token,Token,Token]
					;
				}
			
				export class ParseNodeConditionSet extends ParseNode {
					declare children:
						readonly [Token,ParseNodeConditionSet__0__List,Token]
					;
				}
			
				export class ParseNodeReference extends ParseNode {
					declare children:
						readonly [Token] | readonly [ParseNodeReference,ParseNodeArgumentSet]
					;
				}
			
				export class ParseNodeUnit extends ParseNode {
					declare children:
						readonly [Token] | readonly [Token] | readonly [Token] | readonly [ParseNodeReference] | readonly [Token,ParseNodeDefinition,Token]
					;
				}
			
				export class ParseNodeUnary extends ParseNode {
					declare children:
						readonly [ParseNodeUnit] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token,Token] | readonly [ParseNodeUnit,Token] | readonly [ParseNodeUnit,Token,Token]
					;
				}
			
				export class ParseNodeItem extends ParseNode {
					declare children:
						readonly [ParseNodeUnary] | readonly [ParseNodeConditionSet,ParseNodeItem]
					;
				}
			
				export class ParseNodeOrder extends ParseNode {
					declare children:
						readonly [ParseNodeItem] | readonly [ParseNodeOrder,ParseNodeItem] | readonly [ParseNodeOrder,Token,ParseNodeItem]
					;
				}
			
				export class ParseNodeConcat extends ParseNode {
					declare children:
						readonly [ParseNodeOrder] | readonly [ParseNodeConcat,Token,ParseNodeOrder]
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
			
				export class ParseNodeNonterminalName extends ParseNode {
					declare children:
						readonly [Token] | readonly [ParseNodeNonterminalName,ParseNodeParameterSet]
					;
				}
			
				export class ParseNodeProduction extends ParseNode {
					declare children:
						readonly [ParseNodeNonterminalName,Token,ParseNodeDefinition,Token] | readonly [ParseNodeNonterminalName,Token,Token,ParseNodeDefinition,Token] | readonly [ParseNodeNonterminalName,Token,ParseNodeDefinition,Token] | readonly [ParseNodeNonterminalName,Token,Token,ParseNodeDefinition,Token]
					;
				}
			
				export class ParseNodeGrammar__0__List extends ParseNode {
					declare children:
						readonly [ParseNodeProduction] | readonly [ParseNodeGrammar__0__List,ParseNodeProduction]
					;
				}
			
				export class ParseNodeGrammar extends ParseNode {
					declare children:
						readonly [Token,Token] | readonly [Token,ParseNodeGrammar__0__List,Token]
					;
				}
			
		
		