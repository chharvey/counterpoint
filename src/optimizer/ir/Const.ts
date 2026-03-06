import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {VALUE} from '../../typer/index.ts';
import {
	TypeName,
	ast_type_name,
} from './TypeName.ts';
import {Value} from './Value.ts';



/** A constant primitive value. */
export class Const extends Value {
	public constructor(private readonly value: VALUE.Primitive) {
		super(value.toType());
	}

	public override toString(): string {
		return `(${ TypeName[ast_type_name(this.type)] }.CONST ${ this.value })`;
	}

	@runOnceMethod
	public override validate(): void {
		return assert.ok(this.value.toType().isSubtypeOf(this.type));
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		return this.value.codegen(cg.module);
	}

	public override asTac(): Const {
		return this;
	}
}
