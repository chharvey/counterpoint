import * as assert from 'node:assert';
import {runOnceMethod} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Local} from '../utils-private.ts';
import {OpCode} from './utils-public.ts';
import {
	ast_type_name,
	stringify_type_name,
} from './TypeName.ts';
import {Opcode} from './Opcode.ts';
import type {Value} from './Value.ts';



/** Declare a variable/local without initializing it. */
export class Decl extends Opcode {
	private readonly targetType: TYPE.Type;

	public constructor(
		private readonly target: SymbolSchemaVar | Local,
		private readonly value:  Value,
	) {
		super(OpCode.DECL);
		this.targetType = this.target instanceof SymbolSchemaVar ? this.target.irType : this.target.type;
	}

	@runOnceMethod
	public override validate(): void {
		this.value.validate();
		return assert.ok(this.value.type.isSubtypeOf(this.targetType));
	}

	public override toString(): string {
		return `(${ this.opCodeString } <${ stringify_type_name(ast_type_name(this.targetType)) }> ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name } ${ this.value })`;
	}
}
