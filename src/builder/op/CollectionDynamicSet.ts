import * as assert from 'node:assert';
import type binaryen from 'binaryen';
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
import type {Builder} from '../Builder.ts';
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
		private readonly name:       CollectionDynamicName,
		private readonly collection: ValueTac,
		private readonly accessor:   ValueTac,
		private readonly value:      ValueTac,
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

	@runOnceMethod
	public override validate(builder: Builder): void {
		xjs.Array.forEachAggregated([this.collection, this.accessor, this.value], (value) => value.validate(builder));
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
		const {vm: {Vect, Value, List, Dict, Map: VmMap}, mod} = cg;

		const collection: binaryen.ExpressionRef = this.collection.codegen(cg);
		const accessor:   binaryen.ExpressionRef = this.accessor.codegen(cg);
		const value:      binaryen.ExpressionRef = this.value.codegen(cg);
		const cast_collection = (reftype: binaryen.Type): binaryen.ExpressionRef => Value.cast(collection, reftype);
		switch (this.name) {
			case TypeName.LIST: {
				return List.set(
					cast_collection(cg.vm.reftype.List),
					mod.i32.wrap(Vect.asInt(Value.field(accessor).primitive)),
					value,
				);
			}
			case TypeName.DICT: {
				return Dict.set(
					cast_collection(cg.vm.reftype.Dict),
					Vect.asNat(Value.field(accessor).primitive),
					value,
				);
			}
			case TypeName.SET: {
				const base: Local = cg.newLocal(cast_collection(cg.vm.reftype.Map));
				const xsor: Local = cg.newLocal(accessor, cg.vm.reftype.Value);
				return mod.block(null, [
					base.set(),
					xsor.set(),
					mod.if(
						Vect.isConst(Value.field(value).primitive, true),
						VmMap.set(
							base.get(),
							xsor.get(),
							cg.getConst(null),
						),
						mod.drop(VmMap.delete(
							base.get(),
							xsor.get(),
						)),
					),
				]);
			}
			case TypeName.MAP: {
				return VmMap.set(
					cast_collection(cg.vm.reftype.Map),
					accessor,
					value,
				);
			}
		}
	}
}
