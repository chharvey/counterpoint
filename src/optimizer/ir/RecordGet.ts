import type {AST} from '../../validator/index.ts';
import {TypeName} from './TypeName.ts';
import {Value} from './Value.ts';



/** Read an entry of a record. */
export class RecordGet extends Value {
	public constructor(
		private readonly record:   Value,
		private readonly accessor: AST.ASTNodeKey,
		entry_type: TypeName,
	) {
		super(entry_type);
	}

	public override toString(): string {
		return `(${ TypeName[TypeName.RECORD] }.GET @${ this.accessor.source } ${ this.record })`; // accessor is static so it comes first
	}
}
