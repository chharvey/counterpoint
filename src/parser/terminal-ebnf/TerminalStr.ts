import {
	Token,
	TOKEN,
	Terminal,
} from './package.js';



export class TerminalStr extends Terminal {
	static readonly instance: TerminalStr = new TerminalStr();
	override match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenStr;
	}
}
