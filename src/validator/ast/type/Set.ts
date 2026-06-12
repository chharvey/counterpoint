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



class TypeSet extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeSet {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeSet);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_set_literal'>,
		private readonly type: Type,
	) {
		super(start_node, [type]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.Set(this.type.eval());
	}
}
export {TypeSet as Set};
