import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	type TYPE,
} from '../../typer/index.ts';
import {SymbolSchemaVar} from '../../validator/index.ts';
import type {
	Temp,
	Builder,
} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
import {OpCode} from './Opcode.ts';
import {ValueTac} from './ValueTac.ts';



/** Read the value of a variable/local. */
export class Get extends ValueTac {
	public constructor(target: SymbolSchemaVar, typ: TYPE.Type);
	public constructor(target: Temp);
	public constructor(private readonly target: SymbolSchemaVar | Temp, typ?: TYPE.Type) {
		super(OpCode.GET, target instanceof SymbolSchemaVar ? typ! : target.type);
	}

	public override toString(): string {
		return super.toString(this.target instanceof SymbolSchemaVar ? this.target.source : this.target.name);
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		if (builder.getLocalStatus(this.target) !== 'set') {
			throw new ReferenceError(`Local with id \`${ this.target.id }\` must be set before getting!`);
		}
	}

	public override interpret(interp: Interpreter): VALUE.Value {
		const value: VALUE.Value | null | undefined = interp.getLocalValue(this.target);
		if (value === null) {
			return VALUE.NULL;
		}
		return value ?? assert.fail(new ReferenceError(`Local with id \`${ this.target.id }\` must be set first!`));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.getLocal(this.target)?.get() ?? assert.fail(new ReferenceError(`Local with id \`${ this.target.id }\` must be set first!`));
	}

	public override asTac(): this {
		return this;
	}
}
