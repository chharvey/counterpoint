import {
	Util,
	RadixType,
	maybe,
	maybeA,
	Token,
	TOKEN,
} from './package.js';
import {Terminal} from './Terminal.js';



export class TerminalInteger extends Terminal {
	static readonly instance: TerminalInteger = new TerminalInteger()
	static digitSequence(radix: RadixType = TOKEN.TokenNumber.RADIX_DEFAULT): string {
		return [
			...maybeA(() => [
				TerminalInteger.digitSequence(radix),
				maybe(() => TOKEN.TokenNumber.SEPARATOR),
			]),
			Util.arrayRandom(TOKEN.TokenNumber.DIGITS.get(radix)!),
		].join('')
	}
	random(): string {
		const [base, radix]: [string, RadixType] = Util.arrayRandom([...TOKEN.TokenNumber.BASES])
		return [
			maybe(() => Util.arrayRandom(TOKEN.TokenNumber.UNARY)),
			...(Util.randomBool() ? [
				TerminalInteger.digitSequence(),
			] : [
				TOKEN.TokenNumber.ESCAPER,
				base,
				TerminalInteger.digitSequence(radix),
			]),
		].join('')
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenNumber && !candidate.isFloat
	}
}
