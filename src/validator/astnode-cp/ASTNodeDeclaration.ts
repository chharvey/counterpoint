import type {
	ASTNodeDeclarationType,
	ASTNodeDeclarationVariable,
	ASTNodeDeclarationClaim,
	ASTNodeDeclarationReassignment,
} from './index.js';



/**
 * A sematic node representing a declaration.
 * Known subclasses:
 * - ASTNodeDeclarationType
 * - ASTNodeDeclarationVariable
 * - ASTNodeDeclarationClaim
 * - ASTNodeDeclarationReassignment
 */
export type ASTNodeDeclaration =
	| ASTNodeDeclarationType
	| ASTNodeDeclarationVariable
	| ASTNodeDeclarationClaim
	| ASTNodeDeclarationReassignment
;
