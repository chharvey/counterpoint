import * as assert from 'node:assert';
import type {SyntaxNodeType} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeIndex extends ASTNodeCP {
	public readonly index: bigint;

	public constructor(start_node: SyntaxNodeType<'integer'> | SyntaxNodeType<'natural'>) {
		super(start_node);
		const cooked: bigint | number = Validator.cookTokenNumber(this.start_node.text);
		assert.ok(typeof cooked === 'bigint', 'Cooked value should be a bigint.'); // better type guard than `assert.strictEqual`
		this.index = cooked;
	}
}
