import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
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

	@runOnceMethod
	public override validate(): void {
		xjs.Array.forEachAggregated([this.collection, this.accessor, this.value], (value) => value.validate());
		switch (this.name) {
			case TypeName.LIST: { return assert.ok(this.accessor.type.isSubtypeOf(TYPE.INT)); }
			case TypeName.DICT: { return assert.ok(this.accessor.type.isSubtypeOf(TYPE.SYM)); }
			// TODO: Set and Map type generics
		}
	}

	public override toString(): string {
		return `(${ TypeName[this.name] }.SET ${ this.collection } ${ this.accessor } ${ this.value })`;
	}
}
