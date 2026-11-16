import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Operator} from '../../Operator.ts';
import type {Index} from '../Index-.ts';
import type {Key} from '../Key.ts';
import {Type} from './Type.ts';



export class Access extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Access {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, Access);
		return typ;
	}


	public constructor(
		start_node: SyntaxNodeType<'type_compound'>,
		public readonly base:     Type,
		public readonly accessor: Index | Key,
	) {
		super(start_node, {kind: Operator.DOT}, [base, accessor]);
	}
}
