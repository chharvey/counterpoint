import type {TYPE} from '../../typer/index.ts';
import {TypeName} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a linear collection (tuple/List/Set). */
export class CollectionLinearNew extends Value {
	public constructor(
		public readonly name:  TypeName.TUPLE | TypeName.LIST | TypeName.SET,
		public readonly items: readonly ValueTac[],
		typ: TYPE.Type,
	) {
		super(new Map<TypeName, OpCode>([
			[TypeName.TUPLE, OpCode.TUPLE_NEW],
			[TypeName.LIST,  OpCode.LIST_NEW],
			[TypeName.SET,   OpCode.SET_NEW],
		]).get(name)!, typ);
	}

	public override toString(): string {
		return super.toString(...this.items);
	}
}
