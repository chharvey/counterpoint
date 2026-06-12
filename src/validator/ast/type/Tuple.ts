import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
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

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Tuple(this.children.map((c) => ({
			type:     c.typevalue.eval(),
			optional: c.optional,
		})));
	}
}
export {TypeTuple as Tuple};
