import type {SyntaxNodeType} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {AstNode} from './AstNode.ts';



export class Capture extends AstNode {
	public readonly id: bigint = Validator.cookTokenIdentifier(this.start_node.text);


	public constructor(
		start_node: SyntaxNodeType<'identifier'>,
		private readonly ref: boolean,
	) {
		super(start_node);
	}
}
