import type {
	ASTNodeDeclarationType,
	ASTNodeDeclarationVariable,
	ASTNodeDeclarationClaim,
} from './index.js';



/**
 * A sematic node representing a declaration.
 * Known subclasses:
 * - ASTNodeDeclarationType
 * - ASTNodeDeclarationVariable
 * - ASTNodeDeclarationClaim
 */
export type ASTNodeDeclaration =
	| ASTNodeDeclarationType
	| ASTNodeDeclarationVariable
	| ASTNodeDeclarationClaim
;
