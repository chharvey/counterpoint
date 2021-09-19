import {
	Token,
	ParseNode,
	ASTNode,
} from '@chharvey/parser';
import {
	SolidType,
	Int16,
	Float64,
	TypeError03,
	Validator,
} from './package.js';
import {forEachAggregated} from './utilities.js';



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
		return forEachAggregated(this.children, (c) => c.varCheck(validator));
	}

	/**
	 * Type-check the node as part of semantic analysis.
	 * @param validator stores validation information
	 */
	typeCheck(validator: Validator): void {
		return forEachAggregated(this.children, (c) => c.typeCheck(validator));
	}

	/**
	 * Type-check an assignment.
	 * @final
	 * @param assignee_type the type of the assignee (the variable, bound property, or parameter being reassigned)
	 * @param assigned_type the type of the expression assigned
	 * @param validator     a validator
	 * @throws {TypeError03} if the assigned expression is not assignable to the assignee
	 */
	protected typeCheckAssignment(
		assignee_type: SolidType,
		assigned_type: SolidType,
		validator:     Validator,
	): void {
		const treatIntAsSubtypeOfFloat: boolean = (
			   validator.config.compilerOptions.intCoercion
			&& assigned_type.isSubtypeOf(Int16)
			&& Float64.isSubtypeOf(assignee_type)
		);
		if (!assigned_type.isSubtypeOf(assignee_type) && !treatIntAsSubtypeOfFloat) {
			throw new TypeError03(assignee_type, assigned_type, this);
		}
	}
}
