import * as assert from 'assert';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	INST,
	Builder,
} from '../../index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeTuple);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'tuple_literal', ['variable']>,
		public override readonly children: readonly ASTNodeExpression[],
		private readonly isRef: boolean = true,
	) {
		super(start_node, children);
		this.isRef;
	}

	protected override build_do(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeTuple#build_do not yet supported.';
	}

	protected override type_do(): TYPE.Type {
		return TYPE.TypeTuple.fromTypes(this.children.map((c) => c.type()), true);
	}

	protected override fold_do(): OBJ.Object | null {
		const items: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: new OBJ.Tuple(items as OBJ.Object[]);
	}

	protected override assignTo_do(assignee: TYPE.Type): boolean {
		if (TYPE.TypeTuple.isUnitType(assignee) || assignee instanceof TYPE.TypeTuple) {
			const assignee_type_tuple: TYPE.TypeTuple = (TYPE.TypeTuple.isUnitType(assignee))
				? assignee.value.toType()
				: assignee;
			if (this.children.length < assignee_type_tuple.count[0]) {
				return false;
			}
			xjs.Array.forEachAggregated(assignee_type_tuple.invariants, (thattype, i) => {
				const expr: ASTNodeExpression | undefined = this.children[i];
				if (expr) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition --- bug
					return ASTNodeCP.typeCheckAssignment(
						expr.type(),
						thattype.type,
						expr,
						this.validator,
					);
				}
			});
			return true;
		}
		return false;
	}
}
