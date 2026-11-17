import type {TYPE} from '../../typer/index.ts';
import {
	SymbolSchemaVar,
	SymbolSchemaClass,
} from '../../validator/index.ts';
import type {
	Temp,
	BuilderLocalSymbol,
} from '../Builder.ts';
import {OpCode} from './Opcode.ts';
import {ValueTac} from './ValueTac.ts';



/** Read the value of a variable/local. */
export class Get extends ValueTac {
	public readonly targetName: string;


	public constructor(target: SymbolSchemaVar | SymbolSchemaClass, typ: TYPE.Type);
	public constructor(target: Temp);
	public constructor(public readonly target: BuilderLocalSymbol, typ?: TYPE.Type) {
		super(OpCode.GET, target instanceof SymbolSchemaVar || target instanceof SymbolSchemaClass ? typ! : target.type);
		this.targetName = this.target instanceof SymbolSchemaVar || this.target instanceof SymbolSchemaClass ? this.target.source : this.target.name;
	}


	public override toString(): string {
		return super.toString(this.targetName);
	}

	public override asTac(): this {
		return this;
	}
}
