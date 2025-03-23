import {memoizeGetter} from '../../lib/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';



export class ASTNodeKey extends ASTNodeCP {
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
		this.id; // initialize `this.id`
	}
}
