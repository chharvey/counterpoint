import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	Field_new,
	Value_new,
	type Builder,
	type Local,
} from '../../index.ts';
import {
	type ConstructorType,
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
import type {TypeBuilder} from '../../builder/-types.d.ts';
import {OpCode} from './Opcode.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Create a linear collection (tuple/List/Set). */
export class CollectionLinearNew extends Value {
	public constructor(
		private readonly name:  TypeName.TUPLE | TypeName.LIST | TypeName.SET,
		private readonly items: readonly Value[],
		typ: TYPE.Type,
	) {
		super(new Map<TypeName, OpCode>([
			[TypeName.TUPLE, OpCode.TUPLE_NEW],
			[TypeName.LIST,  OpCode.LIST_NEW],
			[TypeName.SET,   OpCode.SET_NEW],
		]).get(name)!, typ);
	}

	public override toString(): string {
		return super.toString(...this.items);
	}

	@runOnceMethod
	public override validate(): void {
		assert_instanceof(this.type, new Map<TypeName, ConstructorType<TYPE.Type>>([
			[TypeName.TUPLE, TYPE.Tuple],
			[TypeName.LIST,  TYPE.List],
			[TypeName.SET,   TYPE.Set],
		]).get(this.name)!);
		return xjs.Array.forEachAggregated(this.items, (item) => item.validate());
	}

	@memoizeMethod
	public override codegen(cg: Builder): binaryen.ExpressionRef {
		switch (this.name) {
			case TypeName.TUPLE: {
				// @ts-expect-error --- WASM 3.0 (incl. GC) not typed yet
				// eslint-disable-next-line
				const tb: TypeBuilder = new binaryen.TypeBuilder(1);
				if (!this.items.length) {
					tb.setStructType(0, []);
					return cg.module.struct.new_default(tb.buildAndDispose()[0]);
				}
				const codes: readonly binaryen.ExpressionRef[] = this.items.map((item) => item.codegen(cg));
				tb.setStructType(0, codes.map((code) => Field_new(binaryen.getExpressionType(code))));
				return cg.module.struct.new(codes, tb.buildAndDispose()[0]);
			}
			case TypeName.LIST: {
				/**
				 * An array’s capacity is always the least power of 2 greater than or equal to its count, or 8, whichever is greater.
				 * ```
				 * $List[$array].length === max(8, $List[$count])
				 * ```
				 */
				let capacity: number = 8;
				while (capacity < this.items.length) {
					capacity *= 2;
				}

				/*
				 * create an empty internal array with the power of 2 capacity,
				 * fill in the entries,
				 * return a $List type with the $count and $array fields
				 */
				const internalarray: Local = cg.newLocal(
					cg.module.array.new_default(cg.getHeapType('$ListInternal')!, cg.module.i32.const(capacity)),
					cg.getRefType('(ref $ListInternal)'),
				);
				return cg.module.block(null, [
					internalarray.set(),
					...this.items.map((item, i) => cg.module.array.set(
						internalarray.get(),
						cg.module.i32.const(i),
						Value_new(cg, item.codegen(cg)),
					)),
					cg.module.struct.new([
						cg.module.i32.const(this.items.length),
						internalarray.get(),
					], cg.getHeapType('$List')!),
				], cg.getRefType('(ref $List)'));
			}
		}
		throw new Error('not yet supported.');
	}
}
