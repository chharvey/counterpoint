import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type INST,
	type Builder,
	TypeErrorUnexpectedRef,
	type TypeErrorNotAssignable,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeFamily} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeTuple extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTuple {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeTuple);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'tuple_literal', ['variable']>,
		public override readonly children: readonly ASTNodeExpression[],
		is_ref: boolean,
	) {
		super(start_node, children, is_ref);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeTuple#shouldFloat not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeTuple#build not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		const items: readonly TYPE.Type[] = this.children.map((c) => {
			const itemtype: TYPE.Type = c.type();
			if (!this.isRef && itemtype.isReference) {
				throw new TypeErrorUnexpectedRef(itemtype, c);
			}
			return itemtype;
		});
		return (!this.isRef) ? TYPE.TypeVect.fromTypes(items) : TYPE.TypeTuple.fromTypes(items, this.isRef);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const items: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (items.includes(null))
			? null
			: !this.isRef
				? new OBJ.Vect(items as OBJ.Object[])
				: new OBJ.Tuple(items as OBJ.Object[]);
	}

	@ASTNodeCollectionLiteral.assignToDeco
	public override assignTo(assignee: TYPE.Type, err: TypeErrorNotAssignable): void {
		if (assignee instanceof TYPE.TypeTuple) {
			if (this.children.length < assignee.count[0]) {
				throw err;
			}
			return xjs.Array.forEachAggregated(assignee.invariants, (thattype, i) => {
				const expr: ASTNodeExpression | undefined = this.children[i];
				if (expr) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition --- bug
					return ASTNodeCP.assignExpression(expr, thattype.type, expr);
				}
			});
		}
		throw err;
	}
}
