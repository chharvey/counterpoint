import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {CollectionDynamicName} from './utils-public.ts';
import type {Instruction} from './Instruction.ts';
import {
	OpCode,
	Opcode,
} from './Opcode.ts';
import {TypeName} from './TypeName.ts';
import type {Value} from './Value.ts';



/** Copy an existing collection into a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicCopy extends Opcode implements Instruction {
	public constructor(
		private readonly name:        CollectionDynamicName,
		private readonly destination: Value,
		private readonly source:      Value,
	) {
		super(new Map<TypeName, OpCode>([
			[TypeName.LIST, OpCode.LIST_COPY],
			[TypeName.DICT, OpCode.DICT_COPY],
			[TypeName.SET,  OpCode.SET_COPY],
			[TypeName.MAP,  OpCode.MAP_COPY],
		]).get(name)!);
	}

	public override toString(): string {
		return super.toString(this.destination, this.source);
	}

	@runOnceMethod
	public override validate(): void {
		xjs.Array.forEachAggregated([this.destination, this.source], (value) => value.validate());
		switch (this.name) {
			case TypeName.LIST: {
				assert_instanceof(this.destination.type, TYPE.List);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set].some((typ) => this.source.type instanceof typ));
			}
			case TypeName.DICT: {
				assert_instanceof(this.destination.type, TYPE.Dict);
				return assert.ok([TYPE.Tuple, TYPE.Record, TYPE.List, TYPE.Dict, TYPE.Set, TYPE.Map].some((typ) => this.source.type instanceof typ));
			}
			case TypeName.SET: {
				assert_instanceof(this.destination.type, TYPE.Set);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set].some((typ) => this.source.type instanceof typ));
			}
			case TypeName.MAP: {
				assert_instanceof(this.destination.type, TYPE.Map);
				return assert.ok([TYPE.Tuple, TYPE.List, TYPE.Set, TYPE.Map].some((typ) => this.source.type instanceof typ));
			}
		}
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
