import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import type {VALUE} from '../../typer/index.ts';
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

	public override interpret(): VALUE.Value {
		return this.target instanceof SymbolSchemaVar
			// non-null assertions are ok because by the time `new Get(temp)` is called, `temp` will have already been Set
			? this.target.value!
			: this.target.value!.interpret();
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.getLocal(this.target)?.get() ?? assert.fail(new ReferenceError(`Local with id \`${ this.target.id }\` must be set first!`));
	}

	public override asTac(): this {
		return this;
	}
}
