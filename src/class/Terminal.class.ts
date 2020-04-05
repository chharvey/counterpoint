import Util from './Util.class'
import Token, {
	TemplatePosition,
	TokenString,
	TokenTemplate,
	TokenNumber,
	TokenWord,
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



export class TerminalString extends Terminal {
	static readonly instance: TerminalString = new TerminalString()
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
		const escapeChar    = (): string => Util.arrayRandom(TokenString.ESCAPES)
		const escapeCode    = (): string => `u{${Util.randomBool() ? '' : TerminalNumber.digitSequence(16)}}`
		const lineCont      = (): string => `${Util.randomBool() ? '': '\u000d'}\u000a`
		const nonEscapeChar = (): string => Util.randomChar('\' \\ s t n r u \u000D \u000A \u0003'.split(' '))
		return `${TokenString.DELIM}${maybeChars()}${TokenString.DELIM}`
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenString
	}
}
abstract class TerminalTemplate extends Terminal {
	random(start: string = TokenTemplate.DELIM, end: string = TokenTemplate.DELIM): string {
		const maybe = (fun: () => string): string => Util.randomBool() ? '' : fun()
		const forbidden = (): string => Util.randomChar('\' { \u0003'.split(' '))
		const charsEndDelim = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ? `${forbidden()}${maybe(charsEndDelim)}` :
				random < 0.667 ? charsEndDelimStartDelim() :
				                 charsEndDelimStartInterp()
			)
		}
		const charsEndDelimStartDelim = (): string => {
			const random: number = Math.random()
			return (
				random < 0.25 ?   `'${                                                forbidden()}${maybe(charsEndDelim)                              }` :
				random < 0.50 ?  `''${                                                forbidden()}${maybe(charsEndDelim)                              }` :
				random < 0.75 ?  `'{${Util.randomBool() ? '' : Util.randomBool() ? `${forbidden()}${maybe(charsEndDelim)}` : charsEndDelimStartDelim()}` :
				                `''{${Util.randomBool() ? '' : Util.randomBool() ? `${forbidden()}${maybe(charsEndDelim)}` : charsEndDelimStartDelim()}`
			)
		}
		const charsEndDelimStartInterp = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ?   `{${Util.randomBool() ? `${forbidden()}${maybe(charsEndDelim)}` : ''                        }` :
				random < 0.667 ?  `{'${Util.randomBool() ? `${forbidden()}${maybe(charsEndDelim)}` : charsEndDelimStartInterp()}` :
				                 `{''${Util.randomBool() ? `${forbidden()}${maybe(charsEndDelim)}` : charsEndDelimStartInterp()}`
			)
		}
		const charsEndInterp = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ? `${forbidden()}${maybe(charsEndInterp)}` :
				random < 0.667 ? charsEndInterpStartDelim() :
				                 charsEndInterpStartInterp()
			)
		}
		const charsEndInterpStartDelim = (): string => {
			const random: number = Math.random()
			return (
				random < 0.25 ?   `'${Util.randomBool() ? `${forbidden()}${maybe(charsEndInterp)}` : ''                        }` :
				random < 0.50 ?  `''${Util.randomBool() ? `${forbidden()}${maybe(charsEndInterp)}` : ''                        }` :
				random < 0.75 ?  `'{${Util.randomBool() ? `${forbidden()}${maybe(charsEndInterp)}` : charsEndInterpStartDelim()}` :
				                `''{${Util.randomBool() ? `${forbidden()}${maybe(charsEndInterp)}` : charsEndInterpStartDelim()}`
			)
		}
		const charsEndInterpStartInterp = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ?   `{${                                                forbidden()}${maybe(charsEndInterp)                                }` :
				random < 0.667 ?  `{'${Util.randomBool() ? '' : Util.randomBool() ? `${forbidden()}${maybe(charsEndInterp)}` : charsEndInterpStartInterp()}` :
				                 `{''${Util.randomBool() ? '' : Util.randomBool() ? `${forbidden()}${maybe(charsEndInterp)}` : charsEndInterpStartInterp()}`
			)
		}
		return `${start}${maybe(end === TokenTemplate.DELIM ? charsEndDelim : charsEndInterp)}${end}`
	}
	match(candidate: Token, position: TemplatePosition = TemplatePosition.FULL): boolean {
		return candidate instanceof TokenTemplate && candidate.position === position
	}
}
export class TerminalTemplateFull extends TerminalTemplate {
	static readonly instance: TerminalTemplateFull = new TerminalTemplateFull()
	random(): string {
		return super.random(TokenTemplate.DELIM, TokenTemplate.DELIM)
	}
	match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.FULL)
	}
}
export class TerminalTemplateHead extends TerminalTemplate {
	static readonly instance: TerminalTemplateHead = new TerminalTemplateHead()
	random(): string {
		return super.random(TokenTemplate.DELIM, TokenTemplate.DELIM_INTERP_START)
	}
	match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.HEAD)
	}
}
export class TerminalTemplateMiddle extends TerminalTemplate {
	static readonly instance: TerminalTemplateMiddle = new TerminalTemplateMiddle()
	random(): string {
		return super.random(TokenTemplate.DELIM_INTERP_END, TokenTemplate.DELIM_INTERP_START)
	}
	match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.MIDDLE)
	}
}
export class TerminalTemplateTail extends TerminalTemplate {
	static readonly instance: TerminalTemplateTail = new TerminalTemplateTail()
	random(): string {
		return super.random(TokenTemplate.DELIM_INTERP_END, TokenTemplate.DELIM)
	}
	match(candidate: Token): boolean {
		return super.match(candidate, TemplatePosition.TAIL)
	}
}
export class TerminalNumber extends Terminal {
	static readonly instance: TerminalNumber = new TerminalNumber()
	static digitSequence(radix: number): string {
		return `${Util.randomBool() ? '' : `${TerminalNumber.digitSequence(radix)}${Util.randomBool() ? '' : '_'}`}${Util.arrayRandom(TokenNumber.DIGITS.get(radix) !)}`
	}
	random(): string {
		const base: [string, number] = [...TokenNumber.BASES.entries()][Util.randomInt(6)]
		return Util.randomBool() ? TerminalNumber.digitSequence(TokenNumber.RADIX_DEFAULT) : `\\${base[0]}${TerminalNumber.digitSequence(base[1])}`
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenNumber
	}
}
export class TerminalIdentifier extends Terminal {
	static readonly instance: TerminalIdentifier = new TerminalIdentifier()
	random(): string {
		const chars = (start: boolean = false): string => {
			let c: string;
			const pass: RegExp = start ? TokenWord.CHAR_START : TokenWord.CHAR_REST
			do {
				c = Util.randomChar()
			} while (!pass.test(c))
			return start ? c : `${c}${Util.randomBool() ? '' : chars()}`
		}
		let returned: string;
		do {
			returned = `${chars(true)}${Util.randomBool() ? '' : chars()}`
		} while (([...TokenWord.KEYWORDS.values()].flat() as string[]).includes(returned))
		return returned
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenWord && candidate.is_identifier
	}
}
