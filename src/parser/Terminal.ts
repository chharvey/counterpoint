import {titleToMacro} from './utils-private.js';
import type {Token} from './Token.js';



/**
 * A Terminal is a symbol in a production (a formal context-free grammar) that cannot be reduced any further.
 * It serves as a distinction betwen different types of actual tokens.
 */
// @ts-expect-error
abstract class Terminal {
	protected constructor () {
	}

	/** @final */ get displayName(): string {
		return titleToMacro(this.constructor.name.slice('Terminal'.length));
	}

	/**
	 * Does the given Token satisfy this Terminal?
	 * @param   candidate a Token to test
	 * @returns           does the given Token satisfy this Terminal?
	 */
	abstract match(candidate: Token): boolean;
}
