import * as assert from 'node:assert';
import {memoizeGetter} from '../../lib/index.ts';
import {
	type SyntaxNodeType,
	isSyntaxNodeType,
} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



export class ASTNodeIndex extends ASTNodeCP {
	public constructor(start_node: (
		| SyntaxNodeType<'property_access_type'>
		| SyntaxNodeType<'property_access'>
		| SyntaxNodeType<'property_assign'>
	)) {
		super(start_node);
	}

	@memoizeGetter
	public get index(): bigint {
		// NOTE: this needs to be a getter instead of a field because it depends on `this.validator`, which is also a getter
		assert.ok(isSyntaxNodeType(this.start_node.children[1], 'integer'), `Expected ${ this.start_node.children[1] } to be a \`SyntaxNodeType<'integer'>\`.`);
		const cooked: bigint | number = Validator.cookTokenNumber(this.start_node.children[1].text, this.validator.config);
		assert.ok(typeof cooked === 'bigint', 'Cooked value should be a bigint.'); // better type guard than `assert.strictEqual`
		return cooked;
	}
}
