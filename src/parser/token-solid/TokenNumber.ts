import {
	NonemptyArray,
	SolidConfig,
	CONFIG_DEFAULT,
	RadixType,
	Punctuator,
	Char,
} from './package.js';
import {TokenSolid} from './TokenSolid.js';



export class TokenNumber extends TokenSolid {
	static readonly RADIX_DEFAULT: 10n = 10n
	static readonly ESCAPER:   '\\' = '\\'
	static readonly SEPARATOR: '_' = '_'
	static readonly POINT:     '.' = '.'
	static readonly EXPONENT:  'e' = 'e'
	static readonly UNARY: Readonly<NonemptyArray<Punctuator>> = [
		Punctuator.AFF,
		Punctuator.NEG,
	]
	static readonly BASES: ReadonlyMap<string, RadixType> = new Map<string, RadixType>([
		['b',  2n],
		['q',  4n],
		['o',  8n],
		['d', 10n],
		['x', 16n],
		['z', 36n],
	])
	static readonly DIGITS: ReadonlyMap<RadixType, Readonly<NonemptyArray<string>>> = new Map<RadixType, Readonly<NonemptyArray<string>>>([
		[ 2n, '0 1'                                                                     .split(' ') as NonemptyArray<string>],
		[ 4n, '0 1 2 3'                                                                 .split(' ') as NonemptyArray<string>],
		[ 8n, '0 1 2 3 4 5 6 7'                                                         .split(' ') as NonemptyArray<string>],
		[10n, '0 1 2 3 4 5 6 7 8 9'                                                     .split(' ') as NonemptyArray<string>],
		[16n, '0 1 2 3 4 5 6 7 8 9 a b c d e f'                                         .split(' ') as NonemptyArray<string>],
		[36n, '0 1 2 3 4 5 6 7 8 9 a b c d e f g h i j k l m n o p q r s t u v w x y z' .split(' ') as NonemptyArray<string>],
	])
	/**
	 * Compute the token worth of a `TokenNumber` token in Integer format.
	 * @param   text  - the string to compute
	 * @param   radix - the base in which to compute
	 * @param   allow_separators - Should numeric separators be allowed?
	 * @returns         the mathematical value of the string in the given base
	 */
	static tokenWorthInt(
		text: string,
		radix: RadixType = TokenNumber.RADIX_DEFAULT,
		allow_separators: SolidConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
	): number {
		if (text[0] === Punctuator.AFF) { return  TokenNumber.tokenWorthInt(text.slice(1), radix, allow_separators) }
		if (text[0] === Punctuator.NEG) { return -TokenNumber.tokenWorthInt(text.slice(1), radix, allow_separators) }
		if (allow_separators && text[text.length-1] === TokenNumber.SEPARATOR) {
			text = text.slice(0, -1)
		}
		if (text.length === 0) throw new Error('Cannot compute mathematical value of empty string.')
		if (text.length === 1) {
			const digitvalue: number = parseInt(text, Number(radix))
			if (Number.isNaN(digitvalue)) throw new Error(`Invalid number format: \`${text}\``)
			return digitvalue
		}
		return Number(radix) *
			TokenNumber.tokenWorthInt(text.slice(0, -1),     radix, allow_separators) +
			TokenNumber.tokenWorthInt(text[text.length - 1], radix, allow_separators)
	}
	/**
	 * Compute the token worth of a `TokenNumber` token in Float format.
	 * @param   text  - the string to compute
	 * @param   allow_separators - Should numeric separators be allowed?
	 * @returns the mathematical value of the string in the given base
	 */
	private static tokenWorthFloat(
		text: string,
		allow_separators: SolidConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
	): number {
		const base:       number = Number(TokenNumber.RADIX_DEFAULT)
		const pointindex: number = text.indexOf(TokenNumber.POINT)
		const expindex:   number = text.indexOf(TokenNumber.EXPONENT)
		const wholepart:  string = text.slice(0, pointindex)
		const fracpart:   string = ((expindex < 0) ? text.slice(pointindex + 1) : text.slice(pointindex + 1, expindex)) || '0'
		const exppart:    string =  (expindex < 0) ? '0'                        : text.slice(expindex   + 1)
		const wholevalue: number =                  TokenNumber.tokenWorthInt(wholepart, TokenNumber.RADIX_DEFAULT, allow_separators)
		const fracvalue:  number =                  TokenNumber.tokenWorthInt(fracpart,  TokenNumber.RADIX_DEFAULT, allow_separators) * base ** -fracpart.length
		const expvalue:   number = parseFloat(`1e${ TokenNumber.tokenWorthInt(exppart,   TokenNumber.RADIX_DEFAULT, allow_separators) }`) // HACK: more accurate than `base ** exp`
		// const expvalue: number = base ** TokenNumber.tokenWorthInt(exppart, TokenNumber.RADIX_DEFAULT, allow_separators)
		return (wholevalue + fracvalue) * expvalue
	}
	constructor (
		private readonly has_unary: boolean,
		private readonly has_radix: boolean,
		private readonly radix: RadixType,
		private readonly allow_separators: SolidConfig['languageFeatures']['numericSeparators'] = CONFIG_DEFAULT.languageFeatures.numericSeparators,
		...chars: NonemptyArray<Char>
	) {
		super('NUMBER', ...chars);
	}
	cook(): number {
		let text: string = this.source
		const multiplier: number = (text[0] === Punctuator.NEG) ? -1 : 1
		if (this.has_unary) text = text.slice(1) // cut off unary, if any
		if (this.has_radix) text = text.slice(2) // cut off radix, if any
		return multiplier * (this.isFloat
			? TokenNumber.tokenWorthFloat(text,             this.allow_separators)
			: TokenNumber.tokenWorthInt  (text, this.radix, this.allow_separators)
		)
	}
	/**
	 * Is this token a floating-point number?
	 * @returns whether this token contains a decimal point
	 */
	get isFloat(): boolean {
		return this.source.indexOf(TokenNumber.POINT) > 0
	}
}
