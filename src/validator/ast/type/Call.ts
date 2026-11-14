import {
	type NonemptyArray,
	assert_instanceof,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Type} from './Type.ts';



export class Call extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Call {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, Call);
		return typ;
	}


	public constructor(
		start_node: SyntaxNodeType<'type_compound'>,
		public readonly base: Type,
		public readonly args: Readonly<NonemptyArray<Type>>,
	) {
		super(start_node, {}, [base, ...args]);
	}
}
