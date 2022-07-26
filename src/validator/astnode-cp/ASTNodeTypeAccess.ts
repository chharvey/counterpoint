import * as assert from 'assert';
import {
	TYPE,
	Int16,
	SolidTuple,
	SolidRecord,
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
	constructor (
		start_node: SyntaxNodeType<'type_compound'>,
		readonly base:     ASTNodeType,
		readonly accessor: ASTNodeIndexType | ASTNodeKey,
	) {
		super(start_node, {}, [base, accessor]);
	}
	protected override eval_do(): TYPE.SolidType {
		let base_type: TYPE.SolidType = this.base.eval();
		if (base_type instanceof TYPE.SolidTypeIntersection || base_type instanceof TYPE.SolidTypeUnion) {
			base_type = base_type.combineTuplesOrRecords();
		}
		if (this.accessor instanceof ASTNodeIndexType) {
			const accessor_type: TYPE.SolidType = this.accessor.val.eval();
			return (
				(base_type instanceof TYPE.SolidTypeUnit && base_type.value instanceof SolidTuple) ? (
					(accessor_type instanceof TYPE.SolidTypeUnit)
						? base_type.value.toType().get(accessor_type.value as Int16, Operator.DOT, this.accessor)
						: base_type.value.toType().itemTypes()
				) :
				(base_type instanceof TYPE.SolidTypeTuple) ? (
					(accessor_type instanceof TYPE.SolidTypeUnit)
						? base_type.get(accessor_type.value as Int16, Operator.DOT, this.accessor)
						: base_type.itemTypes()
				) :
				(() => { throw new TypeError04('index', base_type, this.accessor); })()
			);
		} else /* (this.accessor instanceof ASTNodeKey) */ {
			return (
				(base_type instanceof TYPE.SolidTypeUnit && base_type.value instanceof SolidRecord) ? base_type.value.toType().get(this.accessor.id, Operator.DOT, this.accessor) :
				(base_type instanceof TYPE.SolidTypeRecord) ? base_type.get(this.accessor.id, Operator.DOT, this.accessor) :
				(() => { throw new TypeError04('property', base_type, this.accessor); })()
			);
		}
	}
}
