import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import {runOnceMethod} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {CollectionDynamicName} from './utils-public.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Read an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicGet extends Value {
	public constructor(
		private readonly name:       CollectionDynamicName,
		private readonly collection: Value,
		private readonly accessor:   Value,
		entry_type: TYPE.Type,
	) {
		super(entry_type);
	}

	@runOnceMethod
	public override validate(): void {
		xjs.Array.forEachAggregated([this.collection, this.accessor], (value) => value.validate());
		switch (this.name) {
			case TypeName.LIST: { return assert.ok(this.accessor.type.isSubtypeOf(TYPE.INT)); }
			case TypeName.DICT: { return assert.ok(this.accessor.type.isSubtypeOf(TYPE.SYM)); }
			// TODO: Set and Map type generics
		}
	}

	public override toString(): string {
		return `(${ TypeName[this.name] }.GET ${ this.collection } ${ this.accessor })`;
	}
}
