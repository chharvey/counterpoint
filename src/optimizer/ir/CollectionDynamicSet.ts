import * as assert from 'node:assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	BinValue,
	type Builder,
	BinVect,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {CollectionDynamicName} from './utils-public.ts';
import type {Instruction} from './Instruction.ts';
import {
	OpCode,
	Opcode,
} from './Opcode.ts';
import {TypeName} from './TypeName.ts';
import type {Value} from './Value.ts';



/** Write to an entry of a dynamic collection (List/Dict/Set/Map). */
export class CollectionDynamicSet extends Opcode implements Instruction {
	public constructor(
		private readonly name:       CollectionDynamicName,
		private readonly collection: Value,
		private readonly accessor:   Value,
		private readonly value:      Value,
	) {
		super(new Map<TypeName, OpCode>([
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
		switch (this.name) {
			case TypeName.LIST: {
				return cg.module.call('List.set', [
					cg.module.ref.cast(new BinValue(cg, this.collection.codegen(cg)).compositeValue, cg.getReftype('(ref $List)')!),
					cg.module.i32.wrap(new BinVect(cg.module, new BinValue(cg, this.accessor.codegen(cg)).primitiveValue).intValue),
					this.value.codegen(cg),
				], binaryen.none);
			}
			case TypeName.DICT: {
				return cg.module.call('Dict.set', [
					cg.module.ref.cast(new BinValue(cg, this.collection.codegen(cg)).compositeValue, cg.getReftype('(ref $Dict)')!),
					cg.module.i32.wrap(new BinVect(cg.module, new BinValue(cg, this.accessor.codegen(cg)).primitiveValue).intValue),
					this.value.codegen(cg),
				], binaryen.none);
			}
		}
		throw new Error('not yet supported.');
	}
}
