import type {ASTNodeCP} from './ASTNodeCP.ts';



/**
 * Check if constant folding is on before calling the getter.
 * @implements GetterDecorator<Foldable, boolean>
 * @typeparam Return      the getter’s return type
 */
export function if_constant_folding(
	getter:   (this: Foldable) => boolean,
	_context: ClassGetterDecoratorContext<Foldable, boolean>,
): typeof getter {
	return function () {
		if (!this.validator.config.compilerOptions.constantFolding) {
			return false;
		}
		return getter.call(this);
	};
}



/**
 * Known implementers:
 * - ASTNodeStatement
 * - ASTNodeBlock
 *
 * Note: For `ASTNodeExpression` objects, just use the result of `ASTNodeExpression#fold()`.
 */
export interface Foldable extends ASTNodeCP {
	/** Return whether this node may be omitted from the compiled output when built. */
	get isFoldable(): boolean;
}
