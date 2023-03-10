import type {Keyword} from '../../parser/index.js';
import {Validator} from '../index.js';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeKey extends ASTNodeCP {
	private _id: bigint | null = null; // TODO use memoize decorator

	public constructor(start_node: SyntaxNodeType<'word'>) {
		super(start_node);
	}

	public get id(): bigint {
		return this._id ??= (isSyntaxNodeType(this.start_node.children[0], 'identifier'))
			? this.validator.cookTokenIdentifier(this.start_node.children[0].text)
			: Validator.cookTokenKeyword(this.start_node.children[0].text as Keyword);
	}

	public override varCheck(): void {
		this.id; // initialize `this._id`
	}
}
