import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../../index.ts';
import {
	type ConstructorType,
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
import {TypeName} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a linear collection (tuple/List/Set). */
export class CollectionLinearNew extends Value {
	public constructor(
		private readonly name:  TypeName.TUPLE | TypeName.LIST | TypeName.SET,
		private readonly items: readonly ValueTac[],
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
	public override validate(builder: Builder): void {
		assert_instanceof(this.type, new Map<TypeName, ConstructorType<TYPE.Type>>([
			[TypeName.TUPLE, TYPE.Tuple],
			[TypeName.LIST,  TYPE.List],
			[TypeName.SET,   TYPE.Set],
		]).get(this.name)!);
		return xjs.Array.forEachAggregated(this.items, (item) => item.validate(builder));
	}

	public override interpret(interp: Interpreter): VALUE.Tuple | VALUE.List | VALUE.Set {
		const items: readonly VALUE.Value[] = this.items.map((value) => value.interpret(interp));
		switch (this.name) {
			case TypeName.TUPLE: { return new VALUE.Tuple(items); }
			case TypeName.LIST:  { return new VALUE.List(items); }
			case TypeName.SET:   { return new VALUE.Set(new Set<VALUE.Value>(items)); }
		}
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		switch (this.name) {
			case TypeName.TUPLE: { return cg.vm.Value.newComposite(cg.codegenTuple (this.items.map((item) => item.codegen(cg)))); }
			case TypeName.LIST:  { return cg.vm.Value.newComposite(cg.codegenList  (this.items.map((item) => item.codegen(cg)))); }
			case TypeName.SET:   { return cg.vm.Value.newComposite(cg.codegenSet   (this.items.map((item) => item.codegen(cg)))); }
		}
	}
}
