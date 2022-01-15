import {
	NonemptyArray,
	Util,
	Keyword,
	Token,
	TOKEN,
	Terminal,
} from './package.js';



const KEYWORD_VALUE: NonemptyArray<Keyword> = [
	Keyword.NULL,
	Keyword.FALSE,
	Keyword.TRUE,
];



export class TerminalKeywordValue extends Terminal {
	static readonly instance: TerminalKeywordValue = new TerminalKeywordValue();
	random(): Keyword {
		return Util.arrayRandom(KEYWORD_VALUE);
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenKeyword && (KEYWORD_VALUE as string[]).includes(candidate.source);
	}
}
