import {AssignmentErrorDuplicateDeclaration} from '../../index.ts';
import type {Serializable} from '../../parser/index.ts';
import {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {
	Block,
	TYPE as AST_TYPE,
	EXPR,
	STMT,
} from './index.ts';
import {AstNode} from './AstNode.ts';
import type {Key} from './Key.ts';



export class ParameterFunction extends AstNode {
	private id?: bigint;


	public constructor(
		start_node: SyntaxNodeFamily<'parameter_function', ['named']>,
		private readonly writable:   boolean,
		private readonly identifier: Serializable | null,
		key:      Key | null,
		typenode: AST_TYPE.Type,
	) {
		super(start_node, {}, [...(key ? [key] : []), typenode]);
	}


	public override varCheck(): void {
		super.varCheck();
		if (this.identifier) {
			const block: Block = (this.parent as EXPR.Function | STMT.DeclarationFunction).block;
			this.id = block.validator.cookTokenIdentifier(this.identifier.source);
			if (block.validator.hasSymbol(this.id)) {
				throw new AssignmentErrorDuplicateDeclaration(this.identifier);
			}
			block.validator.addSymbol(new SymbolSchemaVar(this.id, this.identifier, this.writable, false));
		}
	}
}
