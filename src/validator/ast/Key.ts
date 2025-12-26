import {memoizeGetter} from '../../lib/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {AstNode} from './AstNode.ts';



export class Key extends AstNode {
	public constructor(start_node: SyntaxNodeType<'word'>) {
		super(start_node);
	}

	// NOTE: this needs to be a getter instead of a field because it depends on `this.validator`, which is also a getter
	@memoizeGetter
	public get id(): bigint {
		return this.validator.wordNodeID(this.start_node as SyntaxNodeType<'word'>);
	}

	public override varCheck(): void {
		super.varCheck();
		this.id; // `this.id` must be initialized during `varCheck` because it modifies the validator’s state
	}
}
