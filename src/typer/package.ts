/*
 * -- Internal package use only! --
 * The following components are re-exports from other packages.
 * Other packages should not import them from here;
 * they are only for modules within this package.
 */
export {
	TypeError04,
	VoidError01,
} from '../index.js';
export {
	Set_addEq,
	Set_differenceEq,
	Set_hasEq,
	Set_intersectionEq,
	Set_unionEq,
	Map_getEq,
	Map_hasEq,
	Map_setEq,
} from '../lib/index.js';
export type {
	IntRange,
	CodeUnit,
	Keys,
} from '../lib/utils.js';
export {
	Operator,
	ValidAccessOperator,
	// {ASTNodeKey, ...} as AST,
} from '../validator/index.js';
export * as AST from '../validator/astnode/index.js'; // HACK
