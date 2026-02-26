import type {AST} from '../../validator/index.ts';
import type {TYPE} from '../../typer/index.ts';
import type {Optimizer} from '../Optimizer.ts';
import {Value} from './Value.ts';



/** Read an entry of a record. */
export class RecordGet extends Value {
	public constructor(
		private readonly record:   Value,
		private readonly accessor: AST.ASTNodeKey,
		entry_type: TYPE.Type,
		optimizer:  Optimizer,
	) {
		super(entry_type);
		this.record = record.asTac(optimizer);
	}

	public override toString(): string {
		return `(RECORD.GET @${ this.accessor.source } ${ this.record })`; // accessor is static so it comes first
	}
}
