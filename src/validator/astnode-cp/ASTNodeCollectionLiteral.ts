import type binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	TYPE,
	type Builder,
	type TypeErrorNotAssignable,
} from '../../index.js';
import {memoizeMethod} from '../../lib/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeCP} from './ASTNodeCP.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



/**
 * Known subclasses:
 * - ASTNodeTuple
 * - ASTNodeRecord
 * - ASTNodeSet
 * - ASTNodeMap
 */
export abstract class ASTNodeCollectionLiteral extends ASTNodeExpression {
	/**
	 * Decorator for {@link ASTNodeCollectionLiteral#assignTo} method and any overrides.
	 * Simplifies assignments by handling type operations.
	 * @implements MethodDecorator<ASTNodeCollectionLiteral, ASTNodeCollectionLiteral['assignTo']>
	 */
	protected static assignToDeco(
		method:   ASTNodeCollectionLiteral['assignTo'],
		_context: ClassMethodDecoratorContext<ASTNodeCollectionLiteral, typeof method>,
	): typeof method {
		return function (this: ASTNodeCollectionLiteral, assignee, err) {
			if (assignee instanceof TYPE.TypeIntersection) {
				/* A value is assignable to a type intersection if and only if
				it is assignable to both operands of that intersection. */
				return xjs.Array.forEachAggregated<() => void>([
					() => this.assignTo(assignee.left,  err),
					() => this.assignTo(assignee.right, err),
				], (callback) => callback.call(null));
			} else if (assignee instanceof TYPE.TypeUnion) {
				/* A value is assignable to a type union if and only if
				it is assignable to either operand of that union. */
				try {
					return this.assignTo(assignee.left, err);
				} catch {
					return this.assignTo(assignee.right, err);
				}
			} else {
				return method.call(this, assignee, err);
			}
		};
	}


	protected constructor(
		start_node:
			| SyntaxNodeType<'tuple_literal'>
			| SyntaxNodeType<'record_literal'>
			| SyntaxNodeType<'set_literal'>
			| SyntaxNodeType<'map_literal'>
		,
		public override readonly children: readonly ASTNodeCP[],
	) {
		super(start_node, {}, children);
	}

	@memoizeMethod
	@ASTNodeExpression.buildDeco
	public override build(builder: Builder): binaryen.ExpressionRef {
		builder;
		throw '`ASTNodeCollectionLiteral#build_do` not yet supported.';
	}

	/**
	 * Determine whether this node may be assigned to the given type.
	 * Note that it’s not sufficient to check whether this node’s `.type()` is a subtype of the assignee:
	 * When we assign collection literals, we want to check entry by entry.
	 * @param  assignee                 the type to assign to
	 * @param  err                      the original error, to be thrown if any further assignment fails
	 * @throws {TypeErrorNotAssignable} if this node is not assignable to the assignee
	 */
	public abstract assignTo(assignee: TYPE.Type, err: TypeErrorNotAssignable): void;
}
