import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	TypeError04,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
	Operator,
} from './package.js';
import type {ASTNodeKey} from './ASTNodeKey.js';
import {ASTNodeIndexType} from './ASTNodeIndexType.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeAccess extends ASTNodeType {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeAccess {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeAccess);
		return typ;
	}
	constructor(
		start_node: SyntaxNodeType<'type_compound'>,
		readonly base:     ASTNodeType,
		readonly accessor: ASTNodeIndexType | ASTNodeKey,
	) {
		super(start_node, {}, [base, accessor]);
	}
	protected override eval_do(): TYPE.Type {
		let base_type: TYPE.Type = this.base.eval();
		if (base_type instanceof TYPE.TypeIntersection || base_type instanceof TYPE.TypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		if (this.accessor instanceof ASTNodeIndexType) {
			const accessor_type: TYPE.Type = this.accessor.val.eval();
			return (
				(base_type instanceof TYPE.TypeUnit && base_type.value instanceof OBJ.Tuple) ? (() => (
					(accessor_type instanceof TYPE.TypeUnit)
						? base_type.value.toType().get(accessor_type.value as OBJ.Integer, Operator.DOT, this.accessor)
						: base_type.value.toType().itemTypes()
				))() :
				(base_type instanceof TYPE.TypeTuple) ? (() => (
					(accessor_type instanceof TYPE.TypeUnit)
						? base_type.get(accessor_type.value as OBJ.Integer, Operator.DOT, this.accessor)
						: base_type.itemTypes()
				))() :
				(() => { throw new TypeError04('index', base_type, this.accessor); })()
			);
		} else /* (this.accessor instanceof ASTNodeKey) */ {
			return (
				(base_type instanceof TYPE.TypeUnit && base_type.value instanceof OBJ.Record) ? base_type.value.toType().get(this.accessor.id, Operator.DOT, this.accessor) :
				(base_type instanceof TYPE.TypeRecord)                                        ? base_type.get(this.accessor.id, Operator.DOT, this.accessor)                :
				(() => { throw new TypeError04('property', base_type, this.accessor); })()
			);
		}
	}
}
