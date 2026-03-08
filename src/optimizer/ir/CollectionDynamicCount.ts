import {
	assert_instanceof,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {CollectionDynamicName} from './utils-public.ts';
import {TypeName} from './TypeName.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';



/** Read the number of entries in a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicCount extends Value {
	public constructor(
		private readonly name:       CollectionDynamicName,
		private readonly collection: Value,
	) {
		super(new Map<TypeName, OpCode>([
			[TypeName.LIST, OpCode.LIST_COUNT],
			[TypeName.DICT, OpCode.DICT_COUNT],
			[TypeName.SET,  OpCode.SET_COUNT],
			[TypeName.MAP,  OpCode.MAP_COUNT],
		]).get(name)!, TYPE.NAT);
	}

	@runOnceMethod
	public override validate(): void {
		this.collection.validate();
		switch (this.name) {
			case TypeName.LIST: {
				return assert_instanceof(this.collection.type, TYPE.List);
			}
			case TypeName.DICT: {
				return assert_instanceof(this.collection.type, TYPE.Dict);
			}
			case TypeName.SET: {
				return assert_instanceof(this.collection.type, TYPE.Set);
			}
			case TypeName.MAP: {
				return assert_instanceof(this.collection.type, TYPE.Map);
			}
		}
	}

	public override toString(): string {
		return super.toString(this.collection);
	}
}
