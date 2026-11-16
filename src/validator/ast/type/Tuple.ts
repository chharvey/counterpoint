import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ItemType} from '../ItemType.ts';
import {Type} from './Type.ts';
import {Collection} from './Collection.ts';



class TypeTuple extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeTuple {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeTuple);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_tuple_literal'>,
		public override readonly children: readonly ItemType[],
	) {
		super(start_node, children);
	}
}
export {TypeTuple as Tuple};
