import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	Value_new,
	type Builder,
} from '../../index.ts';
import {
	type ConstructorType,
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {TYPE} from '../../typer/index.ts';
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
				return cg.module.array.new_fixed(
					cg.getHeaptype('$Tuple')!,
					this.items.map((item) => Value_new(cg, item.codegen(cg))),
				);
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

				return cg.module.struct.new([
					cg.module.i32.const(this.items.length),
					cg.module.array.new_fixed(
						cg.getHeaptype('$ListInternal')!,
						Array.from(new Array(capacity), (_, i) => (this.items[i]
							? Value_new(cg, this.items[i].codegen(cg))
							: cg.module.ref.null(cg.getReftype('(ref null $Value)')!)
						)),
					),
				], cg.getHeaptype('$List')!);
			}
		}
		throw new Error('not yet supported.');
	}
}
