import {
	OBJ,
	TYPE,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {Operator} from '../Operator.js';
import {ASTNodeIndex} from './ASTNodeIndex.js';
import {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeAccess extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeAccess {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeAccess);
		return typ;
	}

	public constructor(
		start_node: SyntaxNodeType<'type_compound'>,
		private readonly base:     ASTNodeType,
		public  readonly accessor: ASTNodeIndex | ASTNodeKey,
	) {
		super(start_node, {}, [base, accessor]);
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		let base_type: TYPE.Type = this.base.eval();
		if (base_type instanceof TYPE.Combinable) {
			base_type = base_type.combineTuplesOrRecords();
		}
		if (this.accessor instanceof ASTNodeIndex) {
			assert_instanceof(base_type, TYPE.TypeTuple);
			return base_type.get(new OBJ.Integer(this.accessor.index).toType().value, Operator.DOT, this.accessor);
		} else {
			assert_instanceof(this.accessor, ASTNodeKey);
			assert_instanceof(base_type, TYPE.TypeRecord);
			return base_type.get(this.accessor.id, Operator.DOT, this.accessor);
		}
	}
}
