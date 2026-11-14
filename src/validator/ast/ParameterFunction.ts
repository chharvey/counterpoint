import type {Serializable} from '../../parser/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import type {
	TYPE as AST_TYPE,
	EXPR,
} from './index.ts';
import {AstNode} from './AstNode.ts';
import type {Key} from './Key.ts';



export class ParameterFunction extends AstNode {
	public readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeFamily<'parameter_function', ['named', 'optional']>,
		public readonly identifier: Serializable | null,
		public readonly named:      boolean,
		public readonly writable:   boolean,
		public readonly optional:   boolean,
		public readonly key:        Key | null,
		public readonly typenode:   AST_TYPE.Type,
		public readonly expr:       EXPR.Expression | null,
	) {
		super(start_node, {named, writable, optional}, [
			...(key ? [key] : []),
			typenode,
			...(expr ? [expr] : []),
		]);
		if (this.identifier) {
			this.id = Validator.cookTokenIdentifier(this.identifier.source);
		}
	}


	public get labelId(): bigint | undefined {
		return this.key?.id ?? this.id;
	}
}
