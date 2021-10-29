import type {
	NonemptyArray,
	Token,
	ParseNode,
} from './package.js';
import type {ASTNode} from './astnode/index.js';



type ParseList<T extends ParseNode> = ParseNode & {
	children:
		| readonly [T]
		| readonly [ParseList<T>, T]
	,
};
type HashList<T extends ParseNode> = ParseNode & {
	children:
		| readonly [T]
		| readonly [HashList<T>, Token, T]
	,
};



/**
 * The return type of `Decorator.decorate`.
 * May be an ASTNode, or an array of that, or an array of *that*, and so on.
 */
export type DecoratorReturnType = ASTNode | DecoratorReturnType[];



export abstract class Decorator {
	/**
	 * Decorate a list.
	 * @typeParam T - the type of ParseNode in the list
	 * @typeParam A - the ASTNode that is returned by decoration
	 * @return a sequence of `A` nodes.
	 * @final
	 */
	protected parseList<T extends ParseNode, A extends ASTNode>(node: ParseList<T> | HashList<T>): NonemptyArray<A> {
		return (node.children.length === 1)
			? [this.decorate(node.children[0]) as A]
			: [
				...this.parseList<T, A>(node.children[0]) as NonemptyArray<A>,
				this.decorate((node.children.length === 2) ? node.children[1] : node.children[2]) as A,
			];
	}

	/**
	 * Return an ASTNode corresponding to a ParseNode’s contents.
	 * @param node the ParseNode to decorate
	 * @returns an ASTNode
	 */
	abstract decorate(node: ParseNode): DecoratorReturnType;
}
