import * as assert from 'node:assert';
import {memoizeGetter} from '../../lib/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeIndex extends ASTNodeCP {
	public constructor(start_node: SyntaxNodeType<'integer'>) {
		super(start_node);
	}

	// NOTE: this needs to be a getter instead of a field because it depends on `this.validator`, which is also a getter
	@memoizeGetter
	public get index(): bigint {
		const cooked: bigint | number = Validator.cookTokenNumber(this.start_node.text, this.validator.config);
		assert.ok(typeof cooked === 'bigint', 'Cooked value should be a bigint.'); // better type guard than `assert.strictEqual`
		return cooked;
	}
}
