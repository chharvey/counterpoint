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
import type {PropertyType} from '../PropertyType.ts';
import {Type} from './Type.ts';
import {Tuple} from './Tuple.ts';
import {Record} from './Record.ts';



class TypeFunction extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeFunction {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeFunction);
		return typ;
	}


	public constructor(
		start_node: SyntaxNodeType<'type_function'>,
		private readonly paramPositTypes: ItemType[],
		private readonly paramNamedTypes: PropertyType[],
	) {
		super(start_node, {}, [...paramPositTypes, ...paramNamedTypes]);
	}


	@memoizeMethod
	public override eval(): TYPE.Function {
		return new TYPE.Function(
			Tuple .prototype.eval.call({children: this.paramPositTypes}) as TYPE.Tuple,
			Record.prototype.eval.call({children: this.paramNamedTypes}) as TYPE.Record,
		);
	}
}
export {TypeFunction as Function};
