import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import {
	VALUE,
	type TYPE,
} from '../../typer/index.ts';
import type {Interpreter} from '../Interpreter.ts';
import {TypeName} from './utils-public.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a linear collection (tuple/List/Set). */
export class CollectionLinearNew extends Value {
	public constructor(
		public readonly name:  TypeName.TUPLE | TypeName.LIST | TypeName.SET,
		public readonly items: readonly ValueTac[],
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
			case TypeName.TUPLE: { return cg.vm.Value.fromTuple (cg.codegenTuple (this.items.map((item) => item.codegen(cg)))); }
			case TypeName.LIST:  { return cg.vm.Value.fromList  (cg.codegenList  (this.items.map((item) => item.codegen(cg)))); }
			case TypeName.SET:   { return cg.vm.Value.fromMap   (cg.codegenSet   (this.items.map((item) => item.codegen(cg)))); }
		}
	}
}
