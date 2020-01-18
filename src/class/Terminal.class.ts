import Util from './Util.class'
import Token, {
	TokenNumber,
} from './Token.class'


/**
 * A Terminal is a symbol in a production (a formal context-free grammar) that cannot be reduced any further.
 * It serves as a distinction betwen different types of actual tokens.
 */
export default abstract class Terminal {
	protected constructor() {}
	/** @final */ get displayName(): string {
		return this.constructor.name.replace(/[A-Z]/g, '_$&').slice('_Terminal_'.length).toUpperCase()
	}
	/**
	 * Generate a random instance of this Terminal.
	 * @returns a well-formed string satisfying this Terminal
	 */
	abstract random(): string;
	/**
	 * Does the given Token satisfy this Terminal?
	 * @param   candidate - a Token to test
	 * @returns             does the given Token satisfy this Terminal?
	 */
	abstract match(candidate: Token): boolean;
}


export class TerminalNumber extends Terminal {
	static readonly instance: TerminalNumber = new TerminalNumber()
	static digitSequence(): string {
		return `${Util.randomBool() ? '' : `${TerminalNumber.digitSequence()}`}${Util.arrayRandom(TokenNumber.CHARACTERS)}`
	}
	random(): string {
		return TerminalNumber.digitSequence()
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenNumber
	}
}
