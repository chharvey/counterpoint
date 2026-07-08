import type * as binaryen from 'binaryen.ts';
import * as xjs from 'extrajs';
import type {CodeGenerator} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	type VALUE,
	TYPE,
} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a Dict. */
export class DictNew extends Value {
	public constructor(
		private readonly props: ReadonlyMap<VALUE.Symbol, ValueTac>,
		typ: TYPE.Type,
	) {
		super(OpCode.DICT_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.props].map(([sym, value]) => `${ sym }->${ value }`));
	}

	@runOnceMethod
	public override validate(): void {
		assert_instanceof(this.type, TYPE.Dict);
		return xjs.Map.forEachAggregated(this.props, (value) => value.validate());
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.newComposite(cg.codegenDict(new Map<bigint, binaryen.ExpressionRef>([...this.props].map(([{id}, value]) => [
			id,
			cg.newProperty(id, value.codegen(cg)),
		]))));
	}
}
