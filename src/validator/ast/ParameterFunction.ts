import type {Serializable} from '../../parser/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {TYPE as AST_TYPE} from './index.ts';
import {AstNode} from './AstNode.ts';
import type {Key} from './Key.ts';



export class ParameterFunction extends AstNode {
	public constructor(
		start_node: SyntaxNodeFamily<'parameter_function', ['named']>,
		writable:   boolean,
		identifier: Serializable | null,
		key:        Key | null,
		typenode:   AST_TYPE.Type,
	) {
		super(start_node, {}, [...(key ? [key] : []), typenode]);
	}
}
