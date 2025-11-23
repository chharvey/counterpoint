import type {ASTNodeCP} from './ASTNodeCP.ts';



/**
 * Check if constant folding is on before calling the getter.
 * @implements GetterDecorator<Foldable, boolean>
 */
export function if_constant_folding(
	getter:   (this: Foldable) => boolean,
	_context: ClassGetterDecoratorContext<Foldable, boolean>,
): typeof getter {
	return function () {
		return this.validator.config.compilerOptions.constantFolding && getter.call(this);
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

	/**
	 * Return whether this node contains an expression of type `nothing` (the bottom type).
	 * For expressions, any sub-expression that’s of type `nothing` bubbles up.
	 * This method emulates that for statements and blocks.
	 */
	get hasBottomType(): boolean;
}
