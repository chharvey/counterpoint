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
	Operator,
	ValidAccessOperator,
} from '../validator/index.js';
export * as AST from '../validator/index.js';
