import type * as binaryen from 'binaryen.ts';
import type {
	CodeGenerator,
	Local,
} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
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

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, Vect, Value: VmValue, Case, List, Dict, Map: VmMap}, mod: {wasm}} = cg;

		const collection: binaryen.ExpressionRef = this.collection.codegen(cg);
		const accessor:   binaryen.ExpressionRef = this.accessor.codegen(cg);
		/*
		 * The IR already handled logic for if the collection itself is nullish, so assume by this point it’s not.
		 * But we still need to check for nullish values in the collection.
		 */
		switch (this.name) {
			case TypeName.LIST: {
				return List.get(
					VmValue.asList(collection),
					wasm.i32.wrap_i64(Vect.asInt(VmValue.asPrimitive(accessor))),
				);
			}
			case TypeName.DICT: {
				return Dict.get(
					VmValue.asDict(collection),
					Vect.asNat(VmValue.asPrimitive(accessor)),
				);
			}
			case TypeName.SET: {
				const nullish_case: Local = cg.newLocal(wasm.tuple.extract(VmMap.find(
					VmValue.asMap(collection),
					accessor,
				), 1));

				return wasm.block(null, [
					nullish_case.set(),
					// if `(ref.null $Case)` or a tombstone is returned, return Counterpoint `false`; else return `true`
					wasm.if(
						wasm.i32.or(
							wasm.ref.is_null(nullish_case.get()),
							wasm.ref.eq(nullish_case.get(), Case.TOMBSTONE),
						),
						VmValue.FALSE,
						VmValue.TRUE,
					),
				], reftype.Value);
			}
			case TypeName.MAP: {
				return VmMap.get(
					VmValue.asMap(collection),
					accessor,
				);
			}
		}
	}
}
