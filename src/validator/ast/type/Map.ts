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
		private readonly antecedenttype: Type,
		private readonly consequenttype: Type,
	) {
		super(start_node, [antecedenttype, consequenttype]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Map(this.antecedenttype.eval(), this.consequenttype.eval());
	}
}
export {TypeMap as Map};
