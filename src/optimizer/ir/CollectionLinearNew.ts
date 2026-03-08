import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
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
		return xjs.Array.forEachAggregated(this.items, (item) => item.validate());
	}

	@memoizeMethod
	public override codegen(_: Builder): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}
