import {
	SolidType,
	TypeError03,
	Token,
	ParseNode,
	Validator,
} from './package.js';
import {
	ASTNodeExpression,
	ASTNodeCollectionLiteral,
} from './index.js';
import {ASTNode} from './ASTNode.js';
import {forEachAggregated} from './utils-private.js';



export abstract class ASTNodeSolid extends ASTNode {
	/**
	 * Type-check an assignment.
	 * @final
	 * @param assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
	 * @param assigned      the expression assigned
	 * @param node          the node where the assignment took place
	 * @param validator     a validator for type-checking purposes
	 * @throws {TypeError03} if the assigned expression is not assignable to the assignee
	 */
	static typeCheckAssignment(
		assignee_type: SolidType,
		assigned:      ASTNodeExpression,
		node:          ASTNodeSolid,
		validator:     Validator,
	): void {
		const assigned_type: SolidType = assigned.type(validator);
		const is_subtype: boolean = assigned_type.isSubtypeOf(assignee_type);
		const is_collection_assignable: boolean = (
			   assigned instanceof ASTNodeCollectionLiteral
			&& assigned_type.isSubtypeOf(assignee_type.immutableOf())
		);
		const treatIntAsSubtypeOfFloat: boolean = (
			   validator.config.compilerOptions.intCoercion
			&& assigned_type.isSubtypeOf(SolidType.INT)
			&& SolidType.FLOAT.isSubtypeOf(assignee_type)
		);
		if (!is_subtype && !is_collection_assignable && !treatIntAsSubtypeOfFloat) {
			throw new TypeError03(assignee_type, assigned_type, node);
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
}
