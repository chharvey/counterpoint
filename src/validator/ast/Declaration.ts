import type {
	DeclarationType,
	DeclarationVariable,
} from './index.ts';



/**
 * A sematic node representing a declaration.
 * Known subclasses:
 * - DeclarationType
 * - DeclarationVariable
 */
export type Declaration = (
	| DeclarationType
	| DeclarationVariable
);
