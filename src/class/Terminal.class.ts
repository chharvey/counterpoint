import Util from './Util.class'
import Token, {
	Filebound,
	RadixType,
	TemplatePosition,
	TokenKeyword,
	TokenIdentifier,
	TokenIdentifierBasic,
	TokenNumber,
	TokenString,
	TokenTemplate,
} from './Token.class'



/**
 * A Terminal is a symbol in a production (a formal context-free grammar) that cannot be reduced any further.
 * It serves as a distinction betwen different types of actual tokens.
 */
export default abstract class Terminal {
	static maybe(fun: () => string): string {
		return Util.randomBool() ? '' : fun()
	}
	static maybeA(fun: () => string[]): string[] {
		return Util.randomBool() ? [''] : fun()
	}


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



export class TerminalIdentifier extends Terminal {
	static readonly instance: TerminalIdentifier = new TerminalIdentifier()
	random(): string {
		const charsBasic = (start: boolean = false): string => {
			let c: string;
			const pass: RegExp = start ? TokenIdentifierBasic.CHAR_START : TokenIdentifierBasic.CHAR_REST
			do {
				c = Util.randomChar()
			} while (!pass.test(c))
			return start ? c : `${ c }${ Terminal.maybe(charsBasic) }`
		}
		const charsUnicode = (): string => {
			return `${ Terminal.maybe(charsUnicode) }${ Util.randomChar(['`']) }`
		}
		let returned: string;
		if (Util.randomBool()) {
			do {
				returned = `${ charsBasic(true) }${ Terminal.maybe(charsBasic) }`
			} while ((TokenKeyword.KEYWORDS as string[]).includes(returned))
		} else {
			returned = `\`${ Terminal.maybe(charsUnicode) }\``
		}
		return returned
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenIdentifier
	}
}
export class TerminalInteger extends Terminal {
	static readonly instance: TerminalInteger = new TerminalInteger()
	static digitSequence(radix: RadixType): string {
		return `${
			Terminal.maybe(() => `${ TerminalInteger.digitSequence(radix) }${ Terminal.maybe(() => TokenNumber.SEPARATOR) }`)
		}${Util.arrayRandom(TokenNumber.DIGITS.get(radix) !)}`
	}
	random(): string {
		const [base, radix]: [string, RadixType] = Util.arrayRandom([...TokenNumber.BASES])
		return `${ Terminal.maybe(() => Util.arrayRandom(TokenNumber.UNARY)) }${
			Util.randomBool()
				? TerminalInteger.digitSequence(TokenNumber.RADIX_DEFAULT)
			: `${ TokenNumber.ESCAPER }${ base }${ TerminalInteger.digitSequence(radix) }`
		}`
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenNumber && !candidate.isFloat
	}
}
export class TerminalFloat extends Terminal {
	static readonly instance: TerminalFloat = new TerminalFloat()
	random(): string {
		return [
			Terminal.maybe(() => Util.arrayRandom(TokenNumber.UNARY)),
			TerminalInteger.digitSequence(TokenNumber.RADIX_DEFAULT),
			TokenNumber.POINT,
			...Terminal.maybeA(() => [
				TerminalInteger.digitSequence(TokenNumber.RADIX_DEFAULT),
				...Terminal.maybeA(() => [
					TokenNumber.EXPONENT,
					Terminal.maybe(() => Util.arrayRandom(TokenNumber.UNARY)),
					TerminalInteger.digitSequence(TokenNumber.RADIX_DEFAULT),
				]),
			]),
		].join('')
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenNumber && candidate.isFloat
	}
}
export class TerminalString extends Terminal {
	static readonly instance: TerminalString = new TerminalString()
	private static readonly escape_opts: readonly (() => string)[] = [
		(): string => Util.arrayRandom(TokenString.ESCAPES),
		(): string => `u{${ Terminal.maybe(() => TerminalInteger.digitSequence(16n)) }}`,
		(): string => `\u000a`,
		(): string => Util.randomChar([TokenString.DELIM, TokenString.ESCAPER, ...'s t n r u \u000a'.split(' '), Filebound.EOT]),
	]
	random(): string {
		const maybeChars = (): string => Terminal.maybe(chars)
		const chars = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ? `${ Util.randomChar([TokenString.DELIM, TokenString.ESCAPER, Filebound.EOT]) }${ maybeChars() }` :
				random < 0.667 ? `${ TokenString.ESCAPER }${ Util.arrayRandom(TerminalString.escape_opts)() }${ maybeChars() }` :
				                 `${ TokenString.ESCAPER }u${ Terminal.maybe(() => `${ Util.randomChar([TokenString.DELIM, '{', Filebound.EOT]) }${ maybeChars() }`) }`
			)
		}
		return `${TokenString.DELIM}${maybeChars()}${TokenString.DELIM}`
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenString
	}
}
abstract class TerminalTemplate extends Terminal {
	random(start: string = TokenTemplate.DELIM, end: string = TokenTemplate.DELIM): string {
		const forbidden = (): string => Util.randomChar('\' { \u0003'.split(' '))
		const charsEndDelim = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ? `${ forbidden() }${ Terminal.maybe(charsEndDelim) }` :
				random < 0.667 ? charsEndDelimStartDelim() :
				                 charsEndDelimStartInterp()
			)
		}
		const charsEndDelimStartDelim = (): string => {
			const random: number = Math.random()
			return (
				random < 0.25 ?   `'${                                             forbidden() }${ Terminal.maybe(charsEndDelim)                                 }` :
				random < 0.50 ?  `''${                                             forbidden() }${ Terminal.maybe(charsEndDelim)                                 }` :
				random < 0.75 ?  `'{${Terminal.maybe(() => Util.randomBool() ? `${ forbidden() }${ Terminal.maybe(charsEndDelim) }` : charsEndDelimStartDelim()) }` :
				                `''{${Terminal.maybe(() => Util.randomBool() ? `${ forbidden() }${ Terminal.maybe(charsEndDelim) }` : charsEndDelimStartDelim()) }`
			)
		}
		const charsEndDelimStartInterp = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ?   `{${ Util.randomBool() ? `${ forbidden() }${ Terminal.maybe(charsEndDelim) }` : ''                         }` :
				random < 0.667 ?  `{'${ Util.randomBool() ? `${ forbidden() }${ Terminal.maybe(charsEndDelim) }` : charsEndDelimStartInterp() }` :
				                 `{''${ Util.randomBool() ? `${ forbidden() }${ Terminal.maybe(charsEndDelim) }` : charsEndDelimStartInterp() }`
			)
		}
		const charsEndInterp = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ? `${ forbidden() }${ Terminal.maybe(charsEndInterp) }` :
				random < 0.667 ? charsEndInterpStartDelim() :
				                 charsEndInterpStartInterp()
			)
		}
		const charsEndInterpStartDelim = (): string => {
			const random: number = Math.random()
			return (
				random < 0.25 ?   `'${ Util.randomBool() ? `${ forbidden()}${ Terminal.maybe(charsEndInterp) }` : ''                         }` :
				random < 0.50 ?  `''${ Util.randomBool() ? `${ forbidden()}${ Terminal.maybe(charsEndInterp) }` : ''                         }` :
				random < 0.75 ?  `'{${ Util.randomBool() ? `${ forbidden()}${ Terminal.maybe(charsEndInterp) }` : charsEndInterpStartDelim() }` :
				                `''{${ Util.randomBool() ? `${ forbidden()}${ Terminal.maybe(charsEndInterp) }` : charsEndInterpStartDelim() }`
			)
		}
		const charsEndInterpStartInterp = (): string => {
			const random: number = Math.random()
			return (
				random < 0.333 ?   `{${                                              forbidden() }${ Terminal.maybe(charsEndInterp)                                   }` :
				random < 0.667 ?  `{'${ Terminal.maybe(() => Util.randomBool() ? `${ forbidden() }${ Terminal.maybe(charsEndInterp) }` : charsEndInterpStartInterp()) }` :
				                 `{''${ Terminal.maybe(() => Util.randomBool() ? `${ forbidden() }${ Terminal.maybe(charsEndInterp) }` : charsEndInterpStartInterp()) }`
			)
		}
		return `${ start }${ Terminal.maybe(end === TokenTemplate.DELIM ? charsEndDelim : charsEndInterp) }${ end }`
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
