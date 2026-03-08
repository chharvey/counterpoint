import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {
	assert_instanceof,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {CollectionDynamicName} from './utils-public.ts';
import {TypeName} from './TypeName.ts';
import {
	OpCode,
	Opcode,
} from './Opcode.ts';
import type {Value} from './Value.ts';



/** Write to an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicSet extends Opcode {
	public constructor(
		private readonly name:       CollectionDynamicName,
		private readonly collection: Value,
		private readonly accessor:   Value,
		private readonly value:      Value,
	) {
		super(new Map<TypeName, OpCode>([
			[TypeName.LIST, OpCode.LIST_SET],
			[TypeName.DICT, OpCode.DICT_SET],
			[TypeName.SET,  OpCode.SET_SET],
			[TypeName.MAP,  OpCode.MAP_SET],
		]).get(name)!);
	}

	@runOnceMethod
	public override validate(): void {
		xjs.Array.forEachAggregated([this.collection, this.accessor, this.value], (value) => value.validate());
		switch (this.name) {
			case TypeName.LIST: {
				assert_instanceof(this.collection.type, TYPE.List);
				return assert.ok(this.accessor.type.isSubtypeOf(TYPE.INT.union(TYPE.NAT)));
			}
			case TypeName.DICT: {
				assert_instanceof(this.collection.type, TYPE.Dict);
				return assert.ok(this.accessor.type.isSubtypeOf(TYPE.SYM.union(TYPE.STR)));
			}
			case TypeName.SET: {
				assert_instanceof(this.collection.type, TYPE.Set);
				return; // TODO: Set type generics
			}
			case TypeName.MAP: {
				assert_instanceof(this.collection.type, TYPE.Map);
				return; // TODO: Map type generics
			}
		}
	}

	public override toString(): string {
		return super.toString(this.collection, this.accessor, this.value);
	}
}
