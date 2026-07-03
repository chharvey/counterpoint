import type {SyntaxNodeType} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import {AstNode} from './AstNode.ts';



export class Key extends AstNode {
	public readonly id: bigint = Validator.wordNodeId(this.start_node as SyntaxNodeType<'word'>);


	public constructor(start_node: SyntaxNodeType<'word'>) {
		super(start_node);
	}
}
