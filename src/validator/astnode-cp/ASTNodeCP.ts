import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import {
	TYPE,
	TypeError03,
	serialize,
	Punctuator,
	Validator,
	ASTNode,
} from './package.js';



export abstract class ASTNodeCP extends ASTNode {
	/**
	 * Type-check an assignment.
	 * @final
	 * @param assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
	 * @param assigned_type the type of the expression assigned
	 * @param node          the node where the assignment took place
	 * @param validator     a validator for type-checking purposes
	 * @throws {TypeError03} if the assigned expression is not assignable to the assignee
	 */
	static typeCheckAssignment(
		assignee_type: TYPE.SolidType,
		assigned_type: TYPE.SolidType,
		node:          ASTNodeCP,
		validator:     Validator,
	): void {
		const is_subtype: boolean = assigned_type.isSubtypeOf(assignee_type);
		const treatIntAsSubtypeOfFloat: boolean = (
			   validator.config.compilerOptions.intCoercion
			&& assigned_type.isSubtypeOf(TYPE.SolidType.INT)
			&& TYPE.SolidType.FLOAT.isSubtypeOf(assignee_type)
		);
		if (!is_subtype && !treatIntAsSubtypeOfFloat) {
			throw new TypeError03(assignee_type, assigned_type, node);
		}
	}


	/**
	 * Construct a new ASTNodeCP object.
	 *
	 * @param start_node - The initial node in the parse tree to which this ASTNode corresponds.
	 * @param children   - The set of child inputs that creates this ASTNode.
	 * @param attributes - Any other attributes to attach.
	 */
	constructor(
		protected readonly start_node: SyntaxNode,
		attributes: {[key: string]: unknown} = {},
		override readonly children: readonly ASTNodeCP[] = [],
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
		return (this.parent as ASTNodeCP).validator;
	}

	/**
	 * Perform definite assignment phase of semantic analysis:
	 * - Check that all variables have been assigned before being used.
	 * - Check that no varaible is declared more than once.
	 * - Check that fixed variables are not reassigned.
	 */
	varCheck(): void {
		return xjs.Array.forEachAggregated(this.children, (c) => c.varCheck());
	}

	/**
	 * Type-check the node as part of semantic analysis.
	 */
	typeCheck(): void {
		return xjs.Array.forEachAggregated(this.children, (c) => c.typeCheck());
	}
}
