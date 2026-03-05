import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Local} from '../utils-private.ts';
import {
	ast_type_name,
	stringify_type_name,
} from './TypeName.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Declare a variable/local without initializing it. */
export class Decl extends Instruction {
	private readonly targetType: TYPE.Type;

	public constructor(
		private readonly target: SymbolSchemaVar | Local,
		private readonly value:  Value,
	) {
		super();
		this.targetType = this.target instanceof SymbolSchemaVar ? this.target.irType : this.target.type;
	}

	public override toString(): string {
		return `(DECL <${ stringify_type_name(ast_type_name(this.targetType)) }> ${ this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name } ${ this.value })`;
	}

	@runOnceMethod
	public override validate(): void {
		this.value.validate();
		return assert.ok(this.value.type.isSubtypeOf(this.targetType));
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
