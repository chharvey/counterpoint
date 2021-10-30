import {
	Token,
	TOKEN,
	Terminal,
} from './package.js';



export class TerminalIden extends Terminal {
	static readonly instance: TerminalIden = new TerminalIden();
	override match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenIden;
	}
}
