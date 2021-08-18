import {
	Token,
	ParseNode,
	ASTNode,
} from '@chharvey/parser';
import type {Validator} from './Validator.js';



export abstract class ASTNodeSolid extends ASTNode {
	/**
	 * Construct a new ASTNodeSolid object.
	 *
	 * @param start_node - The initial node in the parse tree to which this ASTNode corresponds.
	 * @param children   - The set of child inputs that creates this ASTNode.
	 * @param attributes - Any other attributes to attach.
	 */
	constructor(
		start_node: Token|ParseNode,
		attributes: {[key: string]: unknown} = {},
		override readonly children: readonly ASTNodeSolid[] = [],
	) {
		super(start_node, attributes, children)
	}

	/**
	 * Perform definite assignment phase of semantic analysis:
	 * - Check that all variables have been assigned before being used.
	 * - Check that no varaible is declared more than once.
	 * - Check that fixed variables are not reassigned.
	 * @param validator a record of declared variable symbols
	 */
	varCheck(validator: Validator): void {
		return this.children.forEach((c) => c.varCheck(validator));
	}

	/**
	 * Type-check the node as part of semantic analysis.
	 * @param validator stores validation information
	 */
	typeCheck(validator: Validator): void {
		return this.children.forEach((c) => c.typeCheck(validator));
	}
}
