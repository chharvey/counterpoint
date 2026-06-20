import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type {ItemType} from '../ItemType.ts';
import type {PropertyType} from '../PropertyType.ts';
import {Type} from './Type.ts';



class TypeFunction extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeFunction {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeFunction);
		return typ;
	}


	public constructor(
		start_node:        SyntaxNodeType<'type_function'>,
		positional_params: ItemType[],
		named_params:      PropertyType[],
	) {
		super(start_node, {}, [...positional_params, ...named_params]);
	}


	@memoizeMethod
	public override eval(): TYPE.Type {
		throw new Error('`TypeFunction#eval` not yet supported.');
	}
}
export {TypeFunction as Function};
