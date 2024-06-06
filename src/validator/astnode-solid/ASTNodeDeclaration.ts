import type {
	ASTNodeDeclarationType,
	ASTNodeDeclarationVariable,
} from './index.js';



/**
 * A sematic node representing a declaration.
 * Known subclasses:
 * - ASTNodeDeclarationType
 * - ASTNodeDeclarationVariable
 */
export type ASTNodeDeclaration =
	| ASTNodeDeclarationType
	| ASTNodeDeclarationVariable
;
