import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import {
	BinConst,
	type CodeGenerator,
	type Local,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
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
		private readonly name:       CollectionDynamicName,
		private readonly collection: ValueTac,
		private readonly accessor:   ValueTac,
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

	@runOnceMethod
	public override validate(): void {
		xjs.Array.forEachAggregated([this.collection, this.accessor], (value) => value.validate());
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
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {Vect, Property, Case, Dict, Map: VmMap}, mod: {wasm}} = cg;

		const collection: binaryen.ExpressionRef = this.collection.codegen(cg);
		const accessor:   binaryen.ExpressionRef = this.accessor.codegen(cg);
		const cast_collection = (reftype: binaryen.Type): binaryen.ExpressionRef => cg.vm.Value.cast(collection, reftype);
		/*
		 * The IR already handled logic for if the collection itself is nullish, so assume by this point it’s not.
		 * But we still need to check for nullish values in the collection.
		 */
		switch (this.name) {
			case TypeName.LIST: {
				const item: Local = cg.newLocal(wasm.array.get(
					cg.vm.List.field(cast_collection(cg.vm.reftype.List)).internal,
					wasm.i32.wrap_i64(Vect.asInt(cg.vm.Value.field(accessor).primitive)),
					cg.vm.reftypeNull.Value,
				)); // `array.get` will trap if array length is 0 or if index is out of bounds. this is by design

				return wasm.block(null, [
					item.set(),
					// if `(ref.null $Value)` is returned, return Counterpoint `null`; else return the value
					wasm.if(
						wasm.ref.is_null(item.get()),
						cg.getConst(BinConst.NULL),
						wasm.ref.as_non_null(item.get()),
					),
				], cg.vm.reftype.Value);
			}
			case TypeName.DICT: {
				const maybe_prop: Local = cg.newLocal(wasm.tuple.extract(Dict.find(
					cast_collection(cg.vm.reftype.Dict),
					Vect.asNat(cg.vm.Value.field(accessor).primitive),
				), 1));

				return wasm.block(null, [
					maybe_prop.set(),
					// if `(ref.null $Property)` or a tombstone is returned, return Counterpoint `null`; else return the property value
					wasm.if(
						wasm.i32.or(
							wasm.ref.is_null(maybe_prop.get()),
							Property.isTombstone(maybe_prop.get()),
						),
						cg.getConst(BinConst.NULL),
						Property.field(maybe_prop.get()).val,
					),
				], cg.vm.reftype.Value);
			}
			case TypeName.SET: {
				const maybe_case: Local = cg.newLocal(wasm.tuple.extract(VmMap.find(
					cast_collection(cg.vm.reftype.Map),
					accessor,
				), 1));

				return wasm.block(null, [
					maybe_case.set(),
					// if `(ref.null $Case)` or a tombstone is returned, return Counterpoint `false`; else return `true`
					wasm.if(
						wasm.i32.or(
							wasm.ref.is_null(maybe_case.get()),
							Case.isTombstone(maybe_case.get()),
						),
						cg.getConst(BinConst.FALSE),
						cg.getConst(BinConst.TRUE),
					),
				], cg.vm.reftype.Value);
			}
			case TypeName.MAP: {
				const maybe_case: Local = cg.newLocal(wasm.tuple.extract(VmMap.find(
					cast_collection(cg.vm.reftype.Map),
					accessor,
				), 1));

				return wasm.block(null, [
					maybe_case.set(),
					// if `(ref.null $Case)` or a tombstone is returned, return Counterpoint `null`; else return the consequent
					wasm.if(
						wasm.i32.or(
							wasm.ref.is_null(maybe_case.get()),
							Case.isTombstone(maybe_case.get()),
						),
						cg.getConst(BinConst.NULL),
						Case.field(maybe_case.get()).con,
					),
				], cg.vm.reftype.Value);
			}
		}
	}
}
