import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {
	CodeGenerator,
	Local,
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
import {
	TypeName,
	type CollectionDynamicName,
} from './utils-public.ts';
import type {Builder} from '../Builder.ts';
import type {Interpreter} from '../Interpreter.ts';
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
	public override validate(builder: Builder): void {
		xjs.Array.forEachAggregated([this.collection, this.accessor], (value) => value.validate(builder));
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

	public override interpret(interp: Interpreter): VALUE.Value {
		const base:     VALUE.Value = this.collection.interpret(interp);
		const accessor: VALUE.Value = this.accessor.interpret(interp);
		switch (this.name) {
			case TypeName.LIST: {
				assert_instanceof(base, VALUE.List);
				try {
					assert_instanceof(accessor, VALUE.Integer);
				} catch {
					assert_instanceof(accessor, VALUE.Natural);
				}
				return base.get(accessor.toBigInt());
			}
			case TypeName.DICT: {
				assert_instanceof(base, VALUE.Dict);
				try {
					assert_instanceof(accessor, VALUE.Symbol);
				} catch {
					assert_instanceof(accessor, VALUE.String);
					throw new Error('String keys for dict access are not yet supported.');
				}
				return base.get(accessor.id);
			}
			case TypeName.SET: {
				assert_instanceof(base, VALUE.Set);
				return base.get(accessor);
			}
			case TypeName.MAP: {
				assert_instanceof(base, VALUE.Map);
				return base.get(accessor);
			}
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, Vect, Value: VmValue, Case, List, Dict, Map: VmMap}, mod: {wasm}} = cg;

		const collection: binaryen.ExpressionRef = this.collection.codegen(cg);
		const accessor:   binaryen.ExpressionRef = this.accessor.codegen(cg);
		const cast_collection = (rt: binaryen.Type): binaryen.ExpressionRef => VmValue.cast(collection, rt);
		/*
		 * The IR already handled logic for if the collection itself is nullish, so assume by this point it’s not.
		 * But we still need to check for nullish values in the collection.
		 */
		switch (this.name) {
			case TypeName.LIST: {
				return List.get(
					cast_collection(reftype.List),
					wasm.i32.wrap_i64(Vect.asInt(VmValue.field(accessor).primitive)),
				);
			}
			case TypeName.DICT: {
				return Dict.get(
					cast_collection(reftype.Dict),
					Vect.asNat(VmValue.field(accessor).primitive),
				);
			}
			case TypeName.SET: {
				const maybe_case: Local = cg.newLocal(wasm.tuple.extract(VmMap.find(
					cast_collection(reftype.Map),
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
						cg.getConst(false),
						cg.getConst(true),
					),
				], reftype.Value);
			}
			case TypeName.MAP: {
				return VmMap.get(
					cast_collection(reftype.Map),
					accessor,
				);
			}
		}
	}
}
