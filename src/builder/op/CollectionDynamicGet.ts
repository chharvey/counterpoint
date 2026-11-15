import type {TYPE} from '../../typer/index.ts';
import {
	TypeName,
	type CollectionDynamicName,
} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Read an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicGet extends Value {
	public constructor(
		public readonly name:       CollectionDynamicName,
		public readonly collection: ValueTac,
		public readonly accessor:   ValueTac,
		entry_type: TYPE.Type,
	) {
		super(new Map<typeof name, OpCode>([
			[TypeName.LIST, OpCode.LIST_GET],
			[TypeName.DICT, OpCode.DICT_GET],
			[TypeName.SET,  OpCode.SET_GET],
			[TypeName.MAP,  OpCode.MAP_GET],
		]).get(name)!, entry_type);
	}

	public override toString(): string {
		return super.toString(this.collection, this.accessor); // dynamic accessor after collection
	}
}
