/*
 * -- Internal package use only! --
 * The following components are re-exports from other packages.
 * Other packages should not import them from here;
 * they are only for modules within this package.
 */
export {
	LexError03,
	LexError04,
	LexError05,
} from '../index.js';
export type {
	NonemptyArray,
	CodeUnit,
} from '../lib/index.js';
export {
	Filebound,
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
	Util,
	Serializable,
	serialize,
} from '../core/index.js';
