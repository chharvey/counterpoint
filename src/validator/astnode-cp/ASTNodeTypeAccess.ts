import {
	type TypeEntry,
	TYPE,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ValidTypeAccessOperator} from '../Operator.ts';
import {
	get_entry_info,
	validate_static_access_kind,
	update_accessed_type,
} from './utils-private.ts';
import type {ASTNodeIndex} from './ASTNodeIndex.ts';
import type {ASTNodeKey} from './ASTNodeKey.ts';
import {ASTNodeType} from './ASTNodeType.ts';



export class ASTNodeTypeAccess extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeAccess {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeAccess);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_compound'>,
		public  readonly kind:     ValidTypeAccessOperator,
		private readonly base:     ASTNodeType,
		public  readonly accessor: ASTNodeIndex | ASTNodeKey,
	) {
		super(start_node, {kind}, [base, accessor]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		let base_type: TYPE.Type = this.base.eval();
		if (base_type instanceof TYPE.Combinable) {
			base_type = base_type.combineTuplesOrRecords();
		}
		const entry: TypeEntry = get_entry_info(base_type, this);
		validate_static_access_kind(this.kind, entry.optional, this);
		return update_accessed_type(entry.type, this.kind);
	}
}
