import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {Temp} from '../Builder.ts';
import {OpCode} from './Opcode.ts';
import {ValueTac} from './ValueTac.ts';



/** Read the value of a variable/local. */
export class Get extends ValueTac {
	public constructor(private readonly target: SymbolSchemaVar | Temp) {
		super(OpCode.GET, target instanceof SymbolSchemaVar ? target.irType : target.type);
	}

	public override toString(): string {
		return super.toString(this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.getLocal(this.target)?.get() ?? assert.fail(new ReferenceError(`Local with id \`${ this.target.id }\` must be set first!`));
	}

	public override asTac(): this {
		return this;
	}
}
