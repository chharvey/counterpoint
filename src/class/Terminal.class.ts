import Util from './Util.class'
import Token, {
	TokenFilebound,
	TokenWhitespace,
	TokenNumber,
	TokenPunctuator,
} from './Token.class'


/**
 * A Terminal is a symbol in a production (a formal context-free grammar) that cannot be reduced any further.
 * It serves as a distinction betwen different types of actual tokens.
 */
export default abstract class Terminal {
	abstract readonly TAGNAME: string;
	/**
	 * Generate a random instance of this Terminal.
	 * @returns a well-formed string satisfying this Terminal
	 */
	abstract random(): string;
	/**
	 * Does the given token satisfy this Terminal?
	 * @param   candidate - a token to test
	 * @returns             does the given token satisfy this Terminal?
	 */
	match(candidate: Token): boolean {
		return candidate.tagname.split('-')[0] === this.TAGNAME
	}
}


export class TerminalFilebound extends Terminal {
	static readonly instance: TerminalFilebound = new TerminalFilebound()
	readonly TAGNAME: string = 'FILEBOUND'
	random(): string {
		return Util.arrayRandom(TokenFilebound.CHARS)
	}
}
export class TerminalWhitespace extends Terminal {
	static readonly instance: TerminalWhitespace = new TerminalWhitespace()
	readonly TAGNAME: string = 'WHITESPACE'
	random(): string {
		return (Util.randomBool() ? '' : this.random()) + Util.arrayRandom(TokenWhitespace.CHARS)
	}
}
export class TerminalComment extends Terminal {
	static readonly instance: TerminalComment = new TerminalComment()
	readonly TAGNAME: string = 'COMMENT'
	random(): string {
		throw new Error('not yet supported')
	}
}
export class TerminalString extends Terminal {
	static readonly instance: TerminalString = new TerminalString()
	readonly TAGNAME: string = 'STRING'
	random(): string {
		throw new Error('not yet supported')
	}
}
export class TerminalNumber extends Terminal {
	static readonly instance: TerminalNumber = new TerminalNumber()
	readonly TAGNAME: string = 'NUMBER'
	random(): string {
		const digitSequenceDec = (): string =>
			(Util.randomBool() ? '' : digitSequenceDec()) + Util.arrayRandom(TokenNumber.DIGITS.get(10) !)
		return digitSequenceDec()
	}
}
export class TerminalWord extends Terminal {
	static readonly instance: TerminalWord = new TerminalWord()
	readonly TAGNAME: string = 'WORD'
	random(): string {
		throw new Error('not yet supported')
	}
}
export class TerminalPunctuator extends Terminal {
	static readonly instance: TerminalPunctuator = new TerminalPunctuator()
	readonly TAGNAME: string = 'PUNCTUATOR'
	random(): string {
		return Util.arrayRandom([
			...TokenPunctuator.CHARS_1,
		])
	}
}
