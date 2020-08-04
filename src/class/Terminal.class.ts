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
		return Util.randomBool() ? [] : fun()
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
	private static charsBasic(start: boolean = false): string {
		let c: string;
		const pass: RegExp = start ? TokenIdentifierBasic.CHAR_START : TokenIdentifierBasic.CHAR_REST
		do {
			c = Util.randomChar()
		} while (!pass.test(c))
		return start ? c : [c, Terminal.maybe(TerminalIdentifier.charsBasic)].join('')
	}
	private static charsUnicode(): string {
		return [Terminal.maybe(TerminalIdentifier.charsUnicode), Util.randomChar(['`'])].join('')
	}
	random(): string {
		let returned: string;
		if (Util.randomBool()) {
			do {
				returned = [TerminalIdentifier.charsBasic(true), Terminal.maybe(TerminalIdentifier.charsBasic)].join('')
			} while ((TokenKeyword.KEYWORDS as string[]).includes(returned))
		} else {
			returned = `\`${ Terminal.maybe(TerminalIdentifier.charsUnicode) }\``
		}
		return returned
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenIdentifier
	}
}
export class TerminalInteger extends Terminal {
	static readonly instance: TerminalInteger = new TerminalInteger()
	static digitSequence(radix: RadixType = TokenNumber.RADIX_DEFAULT): string {
		return [
			...Terminal.maybeA(() => [
				TerminalInteger.digitSequence(radix),
				Terminal.maybe(() => TokenNumber.SEPARATOR),
			]),
			Util.arrayRandom(TokenNumber.DIGITS.get(radix)!),
		].join('')
	}
	random(): string {
		const [base, radix]: [string, RadixType] = Util.arrayRandom([...TokenNumber.BASES])
		return [
			Terminal.maybe(() => Util.arrayRandom(TokenNumber.UNARY)),
			...(Util.randomBool() ? [
				TerminalInteger.digitSequence(),
			] : [
				TokenNumber.ESCAPER,
				base,
				TerminalInteger.digitSequence(radix),
			]),
		].join('')
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
			TerminalInteger.digitSequence(),
			TokenNumber.POINT,
			...Terminal.maybeA(() => [
				TerminalInteger.digitSequence(),
				...Terminal.maybeA(() => [
					TokenNumber.EXPONENT,
					Terminal.maybe(() => Util.arrayRandom(TokenNumber.UNARY)),
					TerminalInteger.digitSequence(),
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
	private static maybeChars(): string {
		const random: number = Math.random()
		return Terminal.maybe(() => (
			random < 1/3 ? [Util.randomChar([TokenString.DELIM, TokenString.ESCAPER, Filebound.EOT]),                                     TerminalString.maybeChars()]   :
			random < 2/3 ? [TokenString.ESCAPER,                                Util.arrayRandom(TerminalString.escape_opts)(),           TerminalString.maybeChars()]   :
			               [TokenString.ESCAPER, 'u', ...Terminal.maybeA(() => [Util.randomChar([TokenString.DELIM, '{', Filebound.EOT]), TerminalString.maybeChars()])]
		).join(''))
	}
	random(): string {
		return [TokenString.DELIM, TerminalString.maybeChars(), TokenString.DELIM].join('')
	}
	match(candidate: Token): boolean {
		return candidate instanceof TokenString
	}
}
abstract class TerminalTemplate extends Terminal {
	private static forbidden(): string { return Util.randomChar('\' { \u0003'.split(' ')) }
	private static charsEndDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndDelim)].join('') :
			random < 2/3 ? TerminalTemplate.charsEndDelimStartDelim() :
			               TerminalTemplate.charsEndDelimStartInterp()
		)
	}
	private static charsEndDelimStartDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/4 ? [`'`,                                                 TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndDelim)                                                 ] :
			random < 2/4 ? [`''`,                                                TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndDelim)                                                 ] :
			random < 3/4 ? [`'{`,  ...Terminal.maybeA(() => Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndDelim)] : [TerminalTemplate.charsEndDelimStartDelim()])] :
			               [`''{`, ...Terminal.maybeA(() => Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndDelim)] : [TerminalTemplate.charsEndDelimStartDelim()])]
		).join('')
	}
	private static charsEndDelimStartInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [`{`,   ...(Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndDelim)] : [''                                         ])] :
			random < 2/3 ? [`{'`,  ...(Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndDelim)] : [TerminalTemplate.charsEndDelimStartInterp()])] :
			               [`{''`, ...(Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndDelim)] : [TerminalTemplate.charsEndDelimStartInterp()])]
		).join('')
	}
	private static charsEndInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndInterp)].join('') :
			random < 2/3 ? TerminalTemplate.charsEndInterpStartDelim() :
			               TerminalTemplate.charsEndInterpStartInterp()
		)
	}
	private static charsEndInterpStartDelim(): string {
		const random: number = Math.random()
		return (
			random < 1/4 ? [`'`,   ...(Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndInterp)] : [''                                         ])] :
			random < 2/4 ? [`''`,  ...(Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndInterp)] : [''                                         ])] :
			random < 3/4 ? [`'{`,  ...(Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndInterp)] : [TerminalTemplate.charsEndInterpStartDelim()])] :
			               [`''{`, ...(Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndInterp)] : [TerminalTemplate.charsEndInterpStartDelim()])]
		).join('')
	}
	private static charsEndInterpStartInterp(): string {
		const random: number = Math.random()
		return (
			random < 1/3 ? [`{`,                                                 TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndInterp)                                                   ] :
			random < 2/3 ? [`{'`,  ...Terminal.maybeA(() => Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndInterp)] : [TerminalTemplate.charsEndInterpStartInterp()])] :
			               [`{''`, ...Terminal.maybeA(() => Util.randomBool() ? [TerminalTemplate.forbidden(), Terminal.maybe(TerminalTemplate.charsEndInterp)] : [TerminalTemplate.charsEndInterpStartInterp()])]
		).join('')
	}
	random(start: string = TokenTemplate.DELIM, end: string = TokenTemplate.DELIM): string {
		return [start, Terminal.maybe(end === TokenTemplate.DELIM ? TerminalTemplate.charsEndDelim : TerminalTemplate.charsEndInterp), end].join('')
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
