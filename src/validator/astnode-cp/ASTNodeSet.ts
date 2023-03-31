import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	type INST,
	type Builder,
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
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeCollectionLiteral} from './ASTNodeCollectionLiteral.js';



export class ASTNodeSet extends ASTNodeCollectionLiteral {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeSet {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeSet);
		return expression;
	}

	public constructor(
		start_node: SyntaxNodeType<'set_literal'>,
		public override readonly children: readonly ASTNodeExpression[],
	) {
		super(start_node, children);
	}

	public override shouldFloat(): boolean {
		throw 'ASTNodeSet#shouldFloat not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): INST.InstructionExpression {
		builder;
		throw 'ASTNodeSet#build_do not yet supported.';
	}

	@memoizeMethod
	@ASTNodeExpression.typeDeco
	public override type(): TYPE.Type {
		return new TYPE.TypeSet(
			TYPE.Type.unionAll(this.children.map((c) => c.type())),
			true,
		);
	}

	@memoizeMethod
	public override fold(): OBJ.Object | null {
		const elements: readonly (OBJ.Object | null)[] = this.children.map((c) => c.fold());
		return (elements.includes(null))
			? null
			: new OBJ.Set(new Set(elements as OBJ.Object[]));
	}

	@ASTNodeCollectionLiteral.assignToDeco
	public override assignTo(assignee: TYPE.Type, err: TypeErrorNotAssignable): void {
		if (assignee instanceof TYPE.TypeSet) {
			// better error reporting to check entry-by-entry instead of checking `this.type().invariant`
			return xjs.Array.forEachAggregated(this.children, (expr) => ASTNodeCP.typeCheckAssignment(
				expr.type(),
				assignee.invariant,
				expr,
				this.validator,
			));
		}
		throw err;
	}
}
