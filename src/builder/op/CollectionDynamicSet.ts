import * as assert from 'node:assert';
import type * as binaryen from 'binaryen.ts';
import type {
	CodeGenerator,
	Local,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {VALUE} from '../../typer/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {
	TypeName,
	type CollectionDynamicName,
} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Instruction} from './Instruction.ts';
import type {ValueTac} from './ValueTac.ts';



/** Write to an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicSet extends Instruction {
	public constructor(
		public readonly name:       CollectionDynamicName,
		public readonly collection: ValueTac,
		public readonly accessor:   ValueTac,
		public readonly value:      ValueTac,
	) {
		super(new Map<typeof name, OpCode>([
			[TypeName.LIST, OpCode.LIST_SET],
			[TypeName.DICT, OpCode.DICT_SET],
			[TypeName.SET,  OpCode.SET_SET],
			[TypeName.MAP,  OpCode.MAP_SET],
		]).get(name)!);
	}

	public override toString(): string {
		return super.toString(this.collection, this.accessor, this.value);
	}

	public override interpret(interp: Interpreter): void {
		const base:     VALUE.Value = this.collection.interpret(interp);
		const accessor: VALUE.Value = this.accessor.interpret(interp);
		const newvalue: VALUE.Value = this.value.interpret(interp);
		switch (this.name) {
			case TypeName.LIST: {
				assert_instanceof(base, VALUE.List);
				try {
					assert_instanceof(accessor, VALUE.Integer);
				} catch {
					assert_instanceof(accessor, VALUE.Natural);
				}
				return base.set(accessor.toBigInt(), newvalue);
			}
			case TypeName.DICT: {
				assert_instanceof(base, VALUE.Dict);
				try {
					assert_instanceof(accessor, VALUE.Symbol);
				} catch {
					assert_instanceof(accessor, VALUE.String);
					throw new Error('String keys for dict access are not yet supported.');
				}
				return base.set(accessor.id, newvalue);
			}
			case TypeName.SET: {
				assert_instanceof(base, VALUE.Set);
				return newvalue.equal(VALUE.TRUE)
					? base.put(accessor)
					: (assert.ok(newvalue.equal(VALUE.FALSE)), base.delete(accessor));
			}
			case TypeName.MAP: {
				assert_instanceof(base, VALUE.Map);
				return base.set(accessor, newvalue);
			}
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		const {vm: {reftype, Vect, Value, List, Dict, Map: VmMap}, mod: {wasm}} = cg;

		const collection: binaryen.ExpressionRef = this.collection.codegen(cg);
		const accessor:   binaryen.ExpressionRef = this.accessor.codegen(cg);
		const value:      binaryen.ExpressionRef = this.value.codegen(cg);
		switch (this.name) {
			case TypeName.LIST: {
				return List.set(
					Value.asList(collection),
					wasm.i32.wrap_i64(Vect.asInt(Value.asPrimitive(accessor))),
					value,
				);
			}
			case TypeName.DICT: {
				return Dict.set(
					Value.asDict(collection),
					Vect.asNat(Value.asPrimitive(accessor)),
					value,
				);
			}
			case TypeName.SET: {
				const base: Local = cg.newLocal(Value.asMap(collection));
				const xsor: Local = cg.newLocal(accessor, reftype.Value);
				return wasm.block(null, [
					base.set(),
					xsor.set(),
					wasm.if(
						Vect.isConst(Value.asPrimitive(value), true),
						VmMap.set(
							base.get(),
							xsor.get(),
							Value.NULL,
						),
						wasm.drop(VmMap.delete(
							base.get(),
							xsor.get(),
						)),
					),
				]);
			}
			case TypeName.MAP: {
				return VmMap.set(
					Value.asMap(collection),
					accessor,
					value,
				);
			}
		}
	}
}
