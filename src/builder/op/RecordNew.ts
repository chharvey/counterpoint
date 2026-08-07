import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../../index.ts';
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
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';
import {Const} from './Const.ts';
import {RecordGet} from './index.ts';



/** Create a record. */
export class RecordNew extends Value {
	public constructor(
		private readonly props: ReadonlyMap<bigint, {readonly keysrc: string, readonly value: ValueTac}>,
		typ: TYPE.Type,
	) {
		super(OpCode.RECORD_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.props].map(([keyid, {keysrc, value}]) => `@${ keysrc || `\\x${ keyid.toString(16) }` }->${ value }`));
	}

	@runOnceMethod
	public override validate(builder: Builder): void {
		assert_instanceof(this.type, TYPE.Record);
		return xjs.Map.forEachAggregated(this.props, ({value}) => value.validate(builder));
	}

	public override interpret(interp: Interpreter): VALUE.Record {
		return new VALUE.Record(new Map<bigint, VALUE.Value>([...this.props].map(([id, {value}]) => [
			id,
			value.interpret(interp),
		])));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newComposite(cg.codegenRecord(new Map<bigint, binaryen.ExpressionRef>([...this.props].map(([id, {value}]) => [
			id,
			cg.newProperty(id, value.codegen(cg)),
		]))));
	}
}



const {isMaybe, value: mval} = TYPE.Maybe.MAYBE_PROPS;
export class Maybe extends RecordNew {
	public static unwrap(some: Value): Value {
		assert_instanceof(some.type, TYPE.Maybe);
		return new RecordGet(some, {keyid: mval.id, keysrc: mval.name}, some.type.typearg);
	}


	public constructor(
		typ: TYPE.Type,
		public readonly value?: Value,
	) {
		super(new Map<bigint, {readonly keysrc: string, readonly value: ValueTac}>([
			[isMaybe.id, {keysrc: isMaybe.name, value: new Const(VALUE.TRUE)}],
			...(value ? [[mval.id, {keysrc: mval.name, value}]] as const : []),
		]), new TYPE.Maybe(typ));
	}


	@runOnceMethod
	public override validate(builder: Builder): void {
		assert_instanceof(this.type, TYPE.Maybe);
		return this.value?.validate(builder);
	}

	// @ts-expect-error --- TODO: convert to own class
	public override interpret(interp: Interpreter): VALUE.Maybe {
		return new VALUE.Maybe(this.value?.interpret(interp) ?? (this.type as TYPE.Maybe).typearg);
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newComposite(cg.codegenMaybe(this.value?.codegen(cg)));
	}
}
