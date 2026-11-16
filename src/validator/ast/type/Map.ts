import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Type} from './Type.ts';
import {Collection} from './Collection.ts';



class TypeMap extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeMap {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeMap);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_map_literal'>,
		public readonly antecedenttype: Type,
		public readonly consequenttype: Type,
	) {
		super(start_node, [antecedenttype, consequenttype]);
	}
}
export {TypeMap as Map};
