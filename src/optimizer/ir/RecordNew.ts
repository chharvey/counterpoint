import type {AST} from '../../validator/index.ts';
import {
	TypeName,
	type Type,
} from './Type.ts';
import {Value} from './Value.ts';



/** Create a record. */
export class RecordNew extends Value {
	public constructor(
		private readonly props: readonly (readonly [AST.ASTNodeKey, Value])[],
		typ: Type,
	) {
		super(typ);
	}

	public override toString(): string {
		const keys:   readonly string[] = this.props.map(([key]) => `@${ key.source }`);
		const values: readonly Value[]  = this.props.map(([_, value]) => value);
		return `(${ TypeName[TypeName.RECORD] }.NEW ${ keys.join(' ') } ${ values.join(' ') })`;
	}
}
