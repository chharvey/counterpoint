import {
	Keyword,
	Validator,
	SyntaxNodeType,
	isSyntaxNodeType,
} from './package.js';
import {ASTNodeSolid} from './ASTNodeSolid.js';



export class ASTNodeKey extends ASTNodeSolid {
	private _id: bigint | null = null; // TODO use memoize decorator

	constructor (start_node: SyntaxNodeType<'word'>) {
		super(start_node);
	}

	get id(): bigint {
		return this._id ??= (isSyntaxNodeType(this.start_node.children[0], 'identifier'))
			? this.validator.cookTokenIdentifier(this.start_node.children[0].text)
			: Validator.cookTokenKeyword(this.start_node.children[0].text as Keyword);
	}

	override varCheck(): void {
		this.id; // initialize `this._id`
	}
}
