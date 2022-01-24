import {
	Keyword,
	TOKEN,
	Validator,
	SyntaxNodeType,
	isSyntaxNodeType,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeKey extends ASTNodeSolid {
	private _id: bigint | null = null; // TODO use memoize decorator

	constructor (start_node: TOKEN.TokenKeyword | TOKEN.TokenIdentifier | SyntaxNodeType<'word'>) {
		super(start_node);
	}

	get id(): bigint {
		return this._id ??= ('tree' in this.start_node)
			? (isSyntaxNodeType(this.start_node.children[0], 'identifier'))
				? this.validator.cookTokenIdentifier(this.start_node.children[0].text)
				: Validator.cookTokenKeyword(this.start_node.children[0].text as Keyword)
			: (this.start_node instanceof TOKEN.TokenKeyword)
				? Validator.cookTokenKeyword(this.start_node.source as Keyword)
				: this.validator.cookTokenIdentifier(this.start_node.source);
	}
}
