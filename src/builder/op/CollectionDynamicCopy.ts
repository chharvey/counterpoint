import {
	TypeName,
	type CollectionDynamicName,
} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {ValueTac} from './ValueTac.ts';



/** Copy an existing collection into a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicCopy extends Instruction {
	public constructor(
		public readonly name:        CollectionDynamicName,
		public readonly destination: ValueTac,
		public readonly source:      ValueTac,
	) {
		super(new Map<typeof name, OpCode>([
			[TypeName.LIST, OpCode.LIST_COPY],
			[TypeName.DICT, OpCode.DICT_COPY],
			[TypeName.SET,  OpCode.SET_COPY],
			[TypeName.MAP,  OpCode.MAP_COPY],
		]).get(name)!);
	}

	public override toString(): string {
		return super.toString(this.destination, this.source);
	}
}
