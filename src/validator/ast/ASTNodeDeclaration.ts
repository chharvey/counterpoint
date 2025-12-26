import type {
	ASTNodeDeclarationType,
	ASTNodeDeclarationVariable,
} from './index.ts';



/**
 * A sematic node representing a declaration.
 * Known subclasses:
 * - ASTNodeDeclarationType
 * - ASTNodeDeclarationVariable
 */
export type ASTNodeDeclaration = (
	| ASTNodeDeclarationType
	| ASTNodeDeclarationVariable
);
