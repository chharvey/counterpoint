import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	BinConst,
	type Builder,
	type Local,
	BinVect,
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
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		const collection: binaryen.ExpressionRef = this.collection.codegen(cg);
		const accessor:   binaryen.ExpressionRef = this.accessor.codegen(cg);
		const value:      binaryen.ExpressionRef = this.value.codegen(cg);
		const cast_collection = (reftype: binaryen.Type): binaryen.ExpressionRef => cg.vm.Value.cast(collection, reftype);
		switch (this.name) {
			case TypeName.LIST: {
				return cg.module.call('List.set', [
					cast_collection(cg.reftype.List),
					cg.module.i32.wrap(cg.vm.Vect.asInt(BinVect.fromValue(cg.vm, accessor).vect)),
					value,
				], binaryen.none);
			}
			case TypeName.DICT: {
				return cg.module.call('Dict.set', [
					cast_collection(cg.reftype.Dict),
					cg.vm.Vect.asNat(BinVect.fromValue(cg.vm, accessor).vect),
					value,
				], binaryen.none);
			}
			case TypeName.SET: {
				const base: Local = cg.newLocal(cast_collection(cg.reftype.Map));
				const xsor: Local = cg.newLocal(accessor, cg.reftype.Value);
				return cg.module.block(null, [
					base.set(),
					xsor.set(),
					cg.module.if(
						cg.vm.Vect.isConst(BinVect.fromValue(cg.vm, value).vect, true),
						cg.module.call('Map.set', [
							base.get(),
							xsor.get(),
							cg.getConst(BinConst.NULL),
						], binaryen.none),
						cg.module.drop(cg.module.call('Map.delete', [
							base.get(),
							xsor.get(),
						], cg.reftypeNull.Value)),
					),
				]);
			}
			case TypeName.MAP: {
				return cg.module.call('Map.set', [
					cast_collection(cg.reftype.Map),
					accessor,
					value,
				], binaryen.none);
			}
		}
	}
}
