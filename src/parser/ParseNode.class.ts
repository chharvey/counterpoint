import type {
	EBNFObject,
} from '../types.d'
import Util from '../class/Util.class'
import type Serializable from '../iface/Serializable.iface'
import type {
	Token,
	TokenFilebound,
	TokenPunctuator,
	TokenKeyword,
	TokenIdentifier,
	TokenNumber,
	TokenString,
	TokenTemplate,
} from '../lexer/'
import type {
	SemanticNodeExpression,
	SemanticNodeConstant,
} from '../validator/'
import type Rule from './Rule.class'



/**
 * A ParseNode is a node in a parse tree for a given input stream.
 * It holds:
 * - the group of child inputs ({@link Token}s and/or other ParseNodes)
 * - the line number and column index where the text code of the node starts
 *
 * @see http://parsingintro.sourceforge.net/#contents_item_8.2
 */
export abstract class ParseNode implements Serializable {
	/**
	 * Takes a list of JSON objects representing syntactic productions
	 * and returns a string in TypeScript language representing subclasses of {@link ParseNode}.
	 * @param json JSON objects representing a production
	 * @returns a string to print to a TypeScript file
	 */
	static fromJSON(jsons: EBNFObject[]): string {
		return `
			import type Token from '../lexer/Token.class';
			import {ParseNode} from '../parser/ParseNode.class';
			${ jsons.map((json) => `
				export class ParseNode${ json.name } extends ParseNode {
					declare children:
						${ json.defn.map((seq) => `readonly [${seq.map((it) =>
							(typeof it === 'string' || 'term' in it)
								? `Token`
								: `ParseNode${ it.prod }`
						) }]`).join(' | ') }
					;
				}
			`).join('') }
		`
	}


	/** @implements Serializable */
	readonly tagname: string = this.rule.production.displayName
	/** @implements Serializable */
	readonly source: string = this.children.map((child) => child.source).join(' ')
	/** @implements Serializable */
	readonly source_index: number = this.children[0].source_index
	/** @implements Serializable */
	readonly line_index: number = this.children[0].line_index
	/** @implements Serializable */
	readonly col_index: number = this.children[0].col_index

	/**
	 * Construct a new ParseNode object.
	 *
	 * @param rule     - The Rule used to create this ParseNode.
	 * @param children - The set of child inputs that creates this ParseNode.
	 */
	constructor(
		readonly rule: Rule,
		readonly children: readonly (Token|ParseNode)[],
	) {
	}

	/**
	 * @implements Serializable
	 */
	serialize(): string {
		const attributes: Map<string, string> = new Map<string, string>()
		if (!(this instanceof ParseNodeGoal)) {
			attributes.set('line', `${this.line_index + 1}`)
			attributes.set('col' , `${this.col_index  + 1}`)
		}
		attributes.set('source', this.source)
		const contents: string = this.children.map((child) => child.serialize()).join('')
		return `<${this.tagname} ${Util.stringifyAttributes(attributes)}>${contents}</${this.tagname}>`
	}
}



abstract class ParseNodeSolid extends ParseNode {
}



export class ParseNodePrimitiveLiteral extends ParseNodeSolid {
	declare children:
		| readonly [TokenKeyword]
		| readonly [TokenNumber]
		| readonly [TokenString] // Dev.supports('literalString')
	;
}
export class ParseNodeTypeKeyword extends ParseNodeSolid {
	declare children:
		| readonly [TokenKeyword]
}
export class ParseNodeTypeUnit extends ParseNodeSolid {
	declare children:
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeTypeKeyword]
		| readonly [TokenPunctuator, ParseNodeType, TokenPunctuator]
}
export class ParseNodeTypeUnary extends ParseNodeSolid {
	declare children:
		| readonly [ParseNodeTypeUnit]
		| readonly [ParseNodeTypeUnary, TokenPunctuator]
}
export class ParseNodeTypeBinary extends ParseNodeSolid {
	declare children:
		| readonly [                                      ParseNodeTypeUnary | ParseNodeTypeBinary]
		| readonly [ParseNodeTypeBinary, TokenPunctuator, ParseNodeTypeUnary | ParseNodeTypeBinary]
}
export class ParseNodeType extends ParseNodeSolid {
	declare children:
		| readonly [ParseNodeTypeBinary]
}
export class ParseNodeStringTemplate extends ParseNodeSolid {
	declare children:
		| readonly [TokenTemplate]
		| readonly [TokenTemplate,                                                        TokenTemplate]
		| readonly [TokenTemplate, ParseNodeExpression,                                   TokenTemplate]
		| readonly [TokenTemplate,                      ParseNodeStringTemplate__0__List, TokenTemplate]
		| readonly [TokenTemplate, ParseNodeExpression, ParseNodeStringTemplate__0__List, TokenTemplate]
}
export type TemplatePartialType = // FIXME spread types
	| [                        SemanticNodeConstant                        ]
	| [                        SemanticNodeConstant, SemanticNodeExpression]
	// | [...TemplatePartialType, SemanticNodeConstant                        ]
	// | [...TemplatePartialType, SemanticNodeConstant, SemanticNodeExpression]
	| SemanticNodeExpression[]
export class ParseNodeStringTemplate__0__List extends ParseNodeSolid {
	declare children:
		| readonly [                                  TokenTemplate                     ]
		| readonly [                                  TokenTemplate, ParseNodeExpression]
		| readonly [ParseNodeStringTemplate__0__List, TokenTemplate                     ]
		| readonly [ParseNodeStringTemplate__0__List, TokenTemplate, ParseNodeExpression]
}
export class ParseNodeExpressionUnit extends ParseNodeSolid {
	declare children:
		| readonly [TokenIdentifier] // Dev.supports('variables')
		| readonly [ParseNodePrimitiveLiteral]
		| readonly [ParseNodeStringTemplate] // Dev.supports('literalTemplate')
		| readonly [TokenPunctuator, ParseNodeExpression, TokenPunctuator]
}
export class ParseNodeExpressionUnary extends ParseNodeSolid {
	declare children:
		| readonly [ParseNodeExpressionUnit]
		| readonly [TokenPunctuator, ParseNodeExpressionUnary]
}
export class ParseNodeExpressionBinary extends ParseNodeSolid {
	declare children:
		| readonly [ParseNodeExpressionUnary                                            ] // Exponential
		| readonly [ParseNodeExpressionUnary, TokenPunctuator, ParseNodeExpressionBinary] // Exponential
		| readonly [                                                           ParseNodeExpressionBinary]
		| readonly [ParseNodeExpressionBinary, TokenPunctuator | TokenKeyword, ParseNodeExpressionBinary]
}
export class ParseNodeExpressionConditional extends ParseNodeSolid {
	declare children:
		| readonly [
			TokenKeyword, ParseNodeExpression,
			TokenKeyword, ParseNodeExpression,
			TokenKeyword, ParseNodeExpression,
		]
}
export class ParseNodeExpression extends ParseNode {
	declare children:
		| readonly [ParseNodeExpressionBinary]
		| readonly [ParseNodeExpressionConditional]
}
export class ParseNodeDeclarationVariable extends ParseNodeSolid {
	declare children:
		| readonly [TokenKeyword,               TokenIdentifier, TokenPunctuator, ParseNodeType, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
		| readonly [TokenKeyword, TokenKeyword, TokenIdentifier, TokenPunctuator, ParseNodeType, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
}
export class ParseNodeStatementAssignment extends ParseNodeSolid {
	declare children:
		| readonly [TokenIdentifier, TokenPunctuator, ParseNodeExpression, TokenPunctuator]
}
export class ParseNodeStatement extends ParseNodeSolid {
	declare children:
		| readonly [                     TokenPunctuator]
		| readonly [ParseNodeExpression, TokenPunctuator]
		| readonly [ParseNodeDeclarationVariable] // Dev.supports('variables')
		| readonly [ParseNodeStatementAssignment] // Dev.supports('variables')
}
export class ParseNodeGoal extends ParseNodeSolid {
	declare children:
		| readonly [TokenFilebound,                         TokenFilebound]
		| readonly [TokenFilebound, ParseNodeGoal__0__List, TokenFilebound]
}
export class ParseNodeGoal__0__List extends ParseNodeSolid {
	declare children:
		| readonly [                        ParseNodeStatement]
		| readonly [ParseNodeGoal__0__List, ParseNodeStatement]
}
