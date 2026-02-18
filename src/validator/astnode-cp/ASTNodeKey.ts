import {memoizeGetter} from '../../lib/index.ts';
import type {Keyword} from '../../parser/index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeKey extends ASTNodeCP {
	public constructor(start_node: SyntaxNodeType<'word'>) {
		super(start_node);
	}

	@memoizeGetter
	public get id(): bigint {
		// NOTE: this needs to be a getter instead of a field because it depends on `this.validator`, which is also a getter
		return (isSyntaxNodeType(this.start_node.children[0], 'identifier'))
			? this.validator.cookTokenIdentifier(this.start_node.children[0].text)
			: Validator.cookTokenKeyword(this.start_node.children[0].text as Keyword);
	}

	public override varCheck(): void {
		super.varCheck();
		this.id; // initialize `this.id`
	}
}
