import Util from './Util.class'
import Token, {
	TemplatePosition,
	TokenFilebound,
	TokenWhitespace,
	TokenComment,
	TokenStringLiteral,
	TokenStringTemplate,
	TokenNumber,
	TokenWord,
	TokenPunctuator,
} from './Token.class'


const digitSequence = (radix: number): string =>
	`${Util.randomBool() ? '' : `${digitSequence(radix)}${Util.randomBool() ? '' : '_'}`}${Util.arrayRandom(TokenNumber.DIGITS.get(radix) !)}`


/**
 * A Terminal is a symbol in a production (a formal context-free grammar) that cannot be reduced any further.
 * It serves as a distinction betwen different types of actual tokens.
 */
export default abstract class Terminal {
	protected constructor() {}
	/**
	 * Generate a random instance of this Terminal.
	 * @returns a well-formed string satisfying this Terminal
	 */
	abstract random(): string;
	/**
	 * Does the given token satisfy this Terminal?
	 * @param   candidate - a Token to test
	 * @returns             does the given Token satisfy this Terminal?
	 */
	abstract match(candidate: Token): boolean;
	protected /** @final */ _match(candidate: Token, tagname: string): boolean {
		return candidate.tagname === tagname
	}
}


export class TerminalFilebound extends Terminal {
	static readonly instance: TerminalFilebound = new TerminalFilebound()
	random(): string {
		return Util.arrayRandom(TokenFilebound.CHARS)
	}
	match(candidate: Token): boolean {
		return this._match(candidate, TokenFilebound.TAGNAME)
	}
}
export class TerminalWhitespace extends Terminal {
	static readonly instance: TerminalWhitespace = new TerminalWhitespace()
	random(): string {
		return `${Util.randomBool() ? '' : this.random()}${Util.arrayRandom(TokenWhitespace.CHARS)}`
	}
	match(candidate: Token): boolean {
		return this._match(candidate, TokenWhitespace.TAGNAME)
	}
}
export class TerminalComment extends Terminal {
	static readonly instance: TerminalComment = new TerminalComment()
	random(): string {
		throw new Error('not yet supported')
	}
	match(candidate: Token): boolean {
		return candidate.tagname.split('-')[0] === TokenComment.TAGNAME
	}
}
export class TerminalStringLiteral extends Terminal {
	static readonly instance: TerminalStringLiteral = new TerminalStringLiteral()
	random(): string {
		const chars = (): string => {
			const random: number = Math.random()
			return (
				random < 0.25 ? `${Util.randomChar('\' \\ \u0003'.split(' '))}${maybeChars()}` :
				random < 0.50 ? `\\${escape()}${maybeChars()}` :
				random < 0.75 ? `\\u${Util.randomBool() ? '' : `${Util.randomChar('\' { \u0003'.split(' '))}${maybeChars()}`}` :
				`\\\u000d${Util.randomBool() ? '' : `${Util.randomChar('\' \u000a \u0003'.split(' '))}${maybeChars()}`}`
			)
		}
		const maybeChars    = (): string => Util.randomBool() ? '' : chars()
		const escape        = (): string => Util.arrayRandom([escapeChar, escapeCode, lineCont, nonEscapeChar])()
		const escapeChar    = (): string => Util.arrayRandom(TokenStringLiteral.ESCAPES)
		const escapeCode    = (): string => `u{${Util.randomBool() ? '' : digitSequence(16)}}`
		const lineCont      = (): string => `${Util.randomBool() ? '': '\u000d'}\u000a`
		const nonEscapeChar = (): string => Util.randomChar('\' \\ s t n r u \u000D \u000A \u0003'.split(' '))
		return `${TokenStringLiteral.DELIM}${maybeChars()}${TokenStringLiteral.DELIM}`
	}
	match(candidate: Token): boolean {
		return this._match(candidate, TokenStringLiteral.TAGNAME)
	}
}
export abstract class TerminalStringTemplate extends Terminal {
	random(start: string = TokenStringTemplate.DELIM, end: string = TokenStringTemplate.DELIM): string {
		const end_delim: boolean = end === TokenStringTemplate.DELIM
		const followsOpenBracket = (): string => Util.randomBool() ? Util.randomChar('` { \\ \u0003'.split(' ')) : `\\${followsBackslash()}`
		const followsBackslash = (): string => Util.randomBool() ? Util.randomChar('` \u0003'.split(' ')) : '`'
		const chars = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ? `${Util.randomChar('` { \\ \u0003'.split(' '))}${maybeChars()}` :
				random < 0.667 ? `{${end_delim && Util.randomBool() ? '' : `${followsOpenBracket()}${maybeChars()}`}` :
				`\\${!end_delim && Util.randomBool() ? '' : `${followsBackslash()}${maybeChars()}`}`
			)
		}
		const maybeChars = (): string => Util.randomBool() ? '' : chars()
		return `${start}${maybeChars()}${end}`
	}
	match(candidate: Token, position: TemplatePosition = TemplatePosition.FULL): boolean {
		return this._match(candidate, `${TokenStringTemplate.TAGNAME}-${position}`)
	}
}
export class TerminalStringTemplateFull extends TerminalStringTemplate {
	static readonly instance: TerminalStringTemplateFull = new TerminalStringTemplateFull()
	random(): string {
		return super.random(TokenStringTemplate.DELIM, TokenStringTemplate.DELIM)
	}
	match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.FULL)
	}
}
export class TerminalStringTemplateHead extends TerminalStringTemplate {
	static readonly instance: TerminalStringTemplateHead = new TerminalStringTemplateHead()
	random(): string {
		return super.random(TokenStringTemplate.DELIM, TokenStringTemplate.DELIM_INTERP_START)
	}
	match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.HEAD)
	}
}
export class TerminalStringTemplateMiddle extends TerminalStringTemplate {
	static readonly instance: TerminalStringTemplateMiddle = new TerminalStringTemplateMiddle()
	random(): string {
		return super.random(TokenStringTemplate.DELIM_INTERP_END, TokenStringTemplate.DELIM_INTERP_START)
	}
	match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.MIDDLE)
	}
}
export class TerminalStringTemplateTail extends TerminalStringTemplate {
	static readonly instance: TerminalStringTemplateTail = new TerminalStringTemplateTail()
	random(): string {
		return super.random(TokenStringTemplate.DELIM_INTERP_END, TokenStringTemplate.DELIM)
	}
	match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.TAIL)
	}
}
export class TerminalNumber extends Terminal {
	static readonly instance: TerminalNumber = new TerminalNumber()
	random(): string {
		const base: [string, number] = [...TokenNumber.BASES.entries()][Util.randomInt(6)]
		return Util.randomBool() ? digitSequence(TokenNumber.RADIX_DEFAULT) : `\\${base[0]}${digitSequence(base[1])}`
	}
	match(candidate: Token): boolean {
		return this._match(candidate, TokenNumber.TAGNAME)
	}
}
export class TerminalWord extends Terminal {
	static readonly instance: TerminalWord = new TerminalWord()
	random(): string {
		throw new Error('not yet supported')
	}
	match(candidate: Token): boolean {
		return this._match(candidate, TokenWord.TAGNAME)
	}
}
export class TerminalPunctuator extends Terminal {
	static readonly instance: TerminalPunctuator = new TerminalPunctuator()
	random(): string {
		return Util.arrayRandom([
			...TokenPunctuator.CHARS_1,
		])
	}
	match(candidate: Token): boolean {
		return this._match(candidate, TokenPunctuator.TAGNAME)
	}
}
