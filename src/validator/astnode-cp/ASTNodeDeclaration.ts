import type {
	ASTNodeDeclarationType,
	ASTNodeDeclarationVariable,
	ASTNodeDeclarationClaim,
	ASTNodeDeclarationReassignment,
} from './index.ts';



/**
 * A sematic node representing a declaration.
 * Known subclasses:
 * - ASTNodeDeclarationType
 * - ASTNodeDeclarationVariable
 * - ASTNodeDeclarationClaim
 * - ASTNodeDeclarationReassignment
 */
export type ASTNodeDeclaration = (
	| ASTNodeDeclarationType
	| ASTNodeDeclarationVariable
	| ASTNodeDeclarationClaim
	| ASTNodeDeclarationReassignment
);
