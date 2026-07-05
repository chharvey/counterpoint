import * as assert from 'node:assert';
import {AssignmentErrorDuplicateDeclaration} from '../../index.ts';
import type {Serializable} from '../../parser/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {SymbolSchemaVar} from '../index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {Validator} from '../Validator.ts';
import type {
	Block,
	TYPE as AST_TYPE,
	EXPR,
	STMT,
} from './index.ts';
import {AstNode} from './AstNode.ts';
import type {Key} from './Key.ts';



export class ParameterFunction extends AstNode {
	private readonly id?: bigint;


	public constructor(
		start_node: SyntaxNodeFamily<'parameter_function', ['named']>,
		public  readonly named:      boolean,
		private readonly writable:   boolean,
		public  readonly identifier: Serializable | null,
		public  readonly key:        Key | null,
		public  readonly typenode:   AST_TYPE.Type,
	) {
		super(start_node, {}, [...(key ? [key] : []), typenode]);
		if (this.identifier) {
			this.id = Validator.cookTokenIdentifier(this.identifier.source);
		}
	}


	public get labelId(): bigint | undefined {
		return this.key?.id ?? this.id;
	}


	public override varCheck(): void {
		super.varCheck();
		if (this.identifier) {
			const block: Block = (this.parent as EXPR.Function | STMT.DeclarationFunction).block;
			if (block.validator.hasSymbol(this.id!)) {
				throw new AssignmentErrorDuplicateDeclaration(this.identifier);
			}
			block.validator.addSymbol(new SymbolSchemaVar(this.id!, this.identifier, this.writable, false));
		}
	}

	public override typeCheck(): void {
		super.typeCheck();
		const param_type: TYPE.Type = this.typenode.eval();
		if (this.identifier) {
			const block: Block = (this.parent as EXPR.Function | STMT.DeclarationFunction).block;
			assert.ok(block.validator.hasSymbol(this.id!), `The validator symbol table should include ${ this.id }.`);
			(block.validator.getSymbol(this.id!) as SymbolSchemaVar).type = param_type;
		}
	}
}
