import type {SyntaxNode} from 'tree-sitter';
import {
	SolidType,
	TypeError03,
	serialize,
	Punctuator,
	forEachAggregated,
	Validator,
	ASTNode,
} from './package.js';



export abstract class ASTNodeSolid extends ASTNode {
	/**
	 * Type-check an assignment.
	 * @final
	 * @param assigned_type the type of the expression assigned
	 * @param assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
	 * @param node          the node where the assignment took place
	 * @param validator     a validator for type-checking purposes
	 * @throws {TypeError03} if the assigned expression is not assignable to the assignee
	 */
	static typeCheckAssignment(
		assigned_type: SolidType,
		assignee_type: SolidType,
		node:          ASTNodeSolid,
		validator:     Validator,
	): void {
		const is_subtype: boolean = assigned_type.isSubtypeOf(assignee_type);
		const treatIntAsSubtypeOfFloat: boolean = (
			   validator.config.compilerOptions.intCoercion
			&& assigned_type.isSubtypeOf(SolidType.INT)
			&& SolidType.FLOAT.isSubtypeOf(assignee_type)
		);
		if (!is_subtype && !treatIntAsSubtypeOfFloat) {
			throw new TypeError03(assigned_type, assignee_type, node);
		}
	}


	/**
	 * Construct a new ASTNodeSolid object.
	 *
	 * @param start_node - The initial node in the parse tree to which this ASTNode corresponds.
	 * @param children   - The set of child inputs that creates this ASTNode.
	 * @param attributes - Any other attributes to attach.
	 */
	constructor(
		protected readonly start_node: SyntaxNode,
		attributes: {[key: string]: unknown} = {},
		override readonly children: readonly ASTNodeSolid[] = [],
	) {
		super(((node: SyntaxNode) => { // COMBAK: TypeScript 4.6+ allows non-`this` code before `super()`
			// @ts-expect-error
			const tree_text:    string = node.tree.input;
			const source:       string = node.text;
			const source_index: number = node.startIndex;
			const prev_chars:   readonly string[] = [...tree_text.slice(0, source_index)];
			return {
				source,
				source_index,
				line_index:   prev_chars.filter((c) => c === '\n').length,
				col_index:    source_index - (prev_chars.lastIndexOf('\n') + 1),
				tagname:      Object.values(Punctuator).find((punct) => punct === node.type) ? 'PUNCTUATOR' : node.type,
				serialize() {
					return serialize(this, this.source);
				},
			};
		})(start_node), attributes, children);
	}

	get validator(): Validator {
		return (this.parent as ASTNodeSolid).validator;
	}

	/**
	 * Perform definite assignment phase of semantic analysis:
	 * - Check that all variables have been assigned before being used.
	 * - Check that no varaible is declared more than once.
	 * - Check that fixed variables are not reassigned.
	 */
	varCheck(): void {
		return forEachAggregated(this.children, (c) => c.varCheck());
	}

	/**
	 * Type-check the node as part of semantic analysis.
	 */
	typeCheck(): void {
		return forEachAggregated(this.children, (c) => c.typeCheck());
	}
}
