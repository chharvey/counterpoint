/*
 * -- Internal package use only! --
 * The following components are re-exports from other packages.
 * Other packages should not import them from here;
 * they are only for modules within this package.
 */
export {
	LexError01,
	LexError02,
	LexError03,
	LexError04,
	LexError05,
} from '../index.js';
export type {
	NonemptyArray,
	CodeUnit,
} from '../lib/index.js';
export {
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Util,
	Serializable,
} from '../core/index.js';
