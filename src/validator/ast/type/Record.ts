import {
	type NonemptyArray,
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	type EntryType,
	TYPE,
} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {PropertyType} from '../PropertyType.ts';
import {Type} from './Type.ts';
import {Collection} from './Collection.ts';



class TypeRecord extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeRecord {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeRecord);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_record_literal'>,
		public override readonly children: Readonly<NonemptyArray<PropertyType>>,
	) {
		super(start_node, children);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Record(new Map<bigint, EntryType>(this.children.map((c) => [
			c.key.id,
			{
				type:     c.typevalue.eval(),
				optional: c.optional,
			},
		])));
	}
}
export {TypeRecord as Record};
