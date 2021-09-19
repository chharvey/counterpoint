import {
	Token,
	Terminal,
} from '@chharvey/parser';
import {
	Util,
	Keyword,
	TOKEN,
} from './package.js';



export class TerminalKeyword extends Terminal {
	static readonly instance: TerminalKeyword = new TerminalKeyword();
	random(): Keyword {
		return Util.arrayRandom(Object.values(Keyword));
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenKeyword;
	}
}
