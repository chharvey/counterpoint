import {
	Util,
	maybe,
	Token,
	TOKEN,
	Terminal,
} from './package.js';
import {TerminalInteger} from './TerminalInteger.js';



export class TerminalFloat extends Terminal {
	static readonly instance: TerminalFloat = new TerminalFloat()
	random(): string {
		return [
			maybe(() => Util.arrayRandom(TOKEN.TokenNumber.UNARY)),
			TerminalInteger.digitSequence(),
			TOKEN.TokenNumber.POINT,
			TerminalInteger.digitSequence(),
			maybe(() => [
				TOKEN.TokenNumber.EXPONENT,
				maybe(() => Util.arrayRandom(TOKEN.TokenNumber.UNARY)),
				TerminalInteger.digitSequence(),
			].join('')),
		].join('')
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenNumber && candidate.isFloat
	}
}
