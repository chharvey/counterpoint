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
import type {ValidTypeAccessOperator} from '../../Operator.ts';
import {
	get_entry_info,
	access_type,
} from '../utils-private.ts';
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
		public  readonly kind:     ValidTypeAccessOperator,
		private readonly base:     Type,
		public  readonly accessor: Index | Key,
	) {
		super(start_node, {kind}, [base, accessor]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		const base_type: TYPE.Type = this.base.eval();
		return access_type(this.kind, base_type, get_entry_info(base_type, this), this);
	}
}
