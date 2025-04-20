import {TYPE} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {
	Operator,
	type ValidTypeAccessOperator,
} from '../Operator.ts';
import {ASTNodeIndex} from './ASTNodeIndex.ts';
import {ASTNodeKey} from './ASTNodeKey.ts';
import {ASTNodeType} from './ASTNodeType.ts';



export class ASTNodeTypeAccess extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeAccess {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeAccess);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_compound'>,
		private readonly kind:     ValidTypeAccessOperator,
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
		switch (true) {
			case this.accessor instanceof ASTNodeIndex: {
				assert_instanceof(base_type, TYPE.Tuple);
				return base_type.get(this.accessor.index, Operator.DOT, true, false, this);
			}
			case this.accessor instanceof ASTNodeKey: {
				assert_instanceof(base_type, TYPE.Record);
				return base_type.get(this.accessor.id, Operator.DOT, true, false, this);
			}
			default: {
				throw new Error(`Expected ${ this.accessor } to be an index or key.`);
			}
		}
	}
}
