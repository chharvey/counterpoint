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
	SolidConfig,
	CONFIG_DEFAULT,
	Dev,
} from '../package.js';
export {LexerSolid} from '../index.js';
export type {RadixType} from '../utils.js';
export {Punctuator} from '../Punctuator.js';
export {Keyword} from '../Keyword.js';
