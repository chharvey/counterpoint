import type {
	DeclarationType,
	DeclarationVariable,
	DeclarationFunction,
} from './index.ts';



/**
 * A sematic node representing a declaration.
 * Known subclasses:
 * - DeclarationType
 * - DeclarationVariable
 * - DeclarationFunction
 */
export type Declaration = (
	| DeclarationType
	| DeclarationVariable
	| DeclarationFunction
);
