import type * as binaryen from 'binaryen.ts';
import type {CodeGenerator} from '../../index.ts';
import {memoizeMethod} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {OpCode} from './Opcode.ts';
import {Value} from './Value.ts';
import type {ValueTac} from './ValueTac.ts';



/** Create a record. */
export class RecordNew extends Value {
	public constructor(
		public readonly props: ReadonlyMap<bigint, {readonly keysrc: string, readonly value: ValueTac}>,
		typ: TYPE.Type,
	) {
		super(OpCode.RECORD_NEW, typ);
	}

	public override toString(): string {
		return super.toString(...[...this.props].map(([keyid, {keysrc, value}]) => `@${keysrc || `\\x${keyid.toString(16)}`}->${value}`));
	}

	@memoizeMethod
	public override codegen(cg: CodeGenerator): binaryen.ExpressionRef {
		return cg.vm.Value.fromRecord(cg.codegenRecord(new Map<bigint, binaryen.ExpressionRef>([...this.props].map(([id, {value}]) => [
			id,
			cg.newProperty(id, value.codegen(cg)),
		]))));
	}
}
