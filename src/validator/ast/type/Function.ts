import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
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
		start_node: SyntaxNodeType<'type_function'>,
		public readonly paramPositTypes: readonly ItemType[],
		public readonly paramNamedTypes: readonly PropertyType[],
		public readonly returnType:      Type | null,
	) {
		super(start_node, {}, [...paramPositTypes, ...paramNamedTypes, ...(returnType ? [returnType] : [])]);
	}
}
export {TypeFunction as Function};
