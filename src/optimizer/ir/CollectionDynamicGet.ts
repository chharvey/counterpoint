import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	STRUCT_FIELD,
	BinValue,
	type Builder,
	type Local,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import type {CollectionDynamicName} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
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
		super(new Map<TypeName, OpCode>([
			[TypeName.LIST, OpCode.LIST_GET],
			[TypeName.DICT, OpCode.DICT_GET],
			[TypeName.SET,  OpCode.SET_GET],
			[TypeName.MAP,  OpCode.MAP_GET],
		]).get(name)!, entry_type);
	}

	public override toString(): string {
		return super.toString(this.collection, this.accessor); // dynamic accessor after collection
	}

	@runOnceMethod
	public override validate(): void {
		xjs.Array.forEachAggregated([this.collection, this.accessor], (value) => value.validate());
		switch (this.name) {
			case TypeName.LIST: {
				assert_instanceof(this.collection.type, TYPE.List);
				return assert.ok(this.accessor.type.isSubtypeOf(TYPE.INT)); // TODO: v0.5: .union(TYPE.NAT)
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
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		cg.module.i32.wrap = (x) => x; // TODO: HACK: remove in v0.5
		const rt_value: binaryen.Type = cg.getReftype('(ref $Value)');
		/*
		 * The IR already handled logic for if the collection itself is nullish, so assume by this point it’s not.
		 * But we still need to check for nullish values in the collection.
		 */
		switch (this.name) {
			case TypeName.LIST: {
				const item: Local = cg.newLocal(cg.module.array.get(
					cg.getListInternal(new BinValue(cg, this.collection.codegen(cg)).cast('(ref $List)')),
					cg.module.i32.wrap(new BinValue(cg, this.accessor.codegen(cg)).interpret('intValue')),
					cg.getReftype('(ref null $Value)'),
				)); // `array.get` will trap if array length is 0 or if index is out of bounds. this is by design

				return cg.module.block(null, [
					item.set(),
					// if `(ref.null $Value)` is returned, return Counterpoint `null`; else return the value
					cg.module.if(
						cg.module.ref.is_null(item.get()),
						new BinValue(cg, VALUE.NULL.codegen(cg.module)).value,
						cg.module.ref.as_non_null(item.get()),
					),
				], rt_value);
			}
			case TypeName.DICT: {
				const maybe_prop: Local = cg.newLocal(cg.module.tuple.extract(cg.module.call('Dict.find', [
					new BinValue(cg, this.collection.codegen(cg)).cast('(ref $Dict)'),
					cg.module.i64.extend_u(new BinValue(cg, this.accessor.codegen(cg)).interpret('intValue')), // TODO: v0.5: intValue will already be i64; remove `cg.module.i64.extend_u()` call
				], binaryen.createType([binaryen.i32, cg.getReftype('(ref null $Property)')])), 1));

				return cg.module.block(null, [
					maybe_prop.set(),
					// if `(ref.null $Property)` or a tombstone is returned, return Counterpoint `null`; else return the property value
					cg.module.if(
						cg.module.i32.or(
							cg.module.ref.is_null(maybe_prop.get()),
							cg.module.call('Property.is-tombstone', [maybe_prop.get()], binaryen.i32),
						),
						new BinValue(cg, VALUE.NULL.codegen(cg.module)).value,
						cg.module.struct.get(STRUCT_FIELD.PROPERTY_VAL, maybe_prop.get(), rt_value),
					),
				], rt_value);
			}
		}
		throw new Error('not yet supported.');
	}
}
