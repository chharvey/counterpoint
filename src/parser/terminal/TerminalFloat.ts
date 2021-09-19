import {
	Token,
	Terminal,
} from '@chharvey/parser';
import {
	Util,
	maybe,
	maybeA,
	TOKEN,
} from './package.js';
import {TerminalInteger} from './TerminalInteger.js';



export class TerminalFloat extends Terminal {
	static readonly instance: TerminalFloat = new TerminalFloat()
	random(): string {
		return [
			maybe(() => Util.arrayRandom(TOKEN.TokenNumber.UNARY)),
			TerminalInteger.digitSequence(),
			TOKEN.TokenNumber.POINT,
			...maybeA(() => [
				TerminalInteger.digitSequence(),
				...maybeA(() => [
					TOKEN.TokenNumber.EXPONENT,
					maybe(() => Util.arrayRandom(TOKEN.TokenNumber.UNARY)),
					TerminalInteger.digitSequence(),
				]),
			]),
		].join('')
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenNumber && candidate.isFloat
	}
}
