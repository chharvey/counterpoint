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



export class List extends Collection {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): List {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, List);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_list_literal'>,
		private readonly type: Type,
	) {
		super(start_node, [type]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		return new TYPE.List(this.type.eval());
	}
}
