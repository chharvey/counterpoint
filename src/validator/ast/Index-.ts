import * as assert from 'node:assert';
import type {SyntaxNodeType} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {AstNode} from './AstNode.ts';



export class Index extends AstNode {
	public readonly index: bigint;

	public constructor(start_node: SyntaxNodeType<'integer'> | SyntaxNodeType<'natural'>) {
		super(start_node);
		const cooked: bigint | number = Validator.cookTokenNumber(this.start_node.text).value;
		assert.ok(typeof cooked === 'bigint', 'Cooked value should be a bigint.'); // better type guard than `assert.strictEqual`
		this.index = cooked;
	}
}
