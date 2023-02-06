/*
 * -- Internal package use only! --
 * The following components are re-exports from other packages.
 * Other packages should not import them from here;
 * they are only for modules within this package.
 */
export {
	Builder,
	TypeError04,
	IntRange,
	throw_expression,
	strictEqual,
	Operator,
	ValidAccessOperator,
	AST,
} from '../package.js';
export {TypeEntry} from '../utils-public.js';
export {languageValuesIdentical} from '../utils-private.js';
export * as OBJ from '../cp-object/index.js';
