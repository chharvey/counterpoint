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
import {TypeName} from './TypeName.ts';
import {Instruction} from './Instruction.ts';
import type {Value} from './Value.ts';



/** Write to an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicSet extends Instruction {
	public constructor(
		private readonly name:       CollectionDynamicName,
		private readonly collection: Value,
		private readonly accessor:   Value,
		private readonly value:      Value,
	) {
		super();
	}

	public override toString(): string {
		return `(${ TypeName[this.name] }.SET ${ this.collection } ${ this.accessor } ${ this.value })`;
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

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
