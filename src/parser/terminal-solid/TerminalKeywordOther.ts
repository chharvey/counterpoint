import {
	NonemptyArray,
	Util,
	Keyword,
	Token,
	TOKEN,
	Terminal,
} from './package.js';



const KEYWORD_OTHER: NonemptyArray<Keyword> = [
	Keyword.MUTABLE,
	Keyword.IS,
	Keyword.ISNT,
	Keyword.IF,
	Keyword.THEN,
	Keyword.ELSE,
	Keyword.TYPE,
	Keyword.LET,
	Keyword.UNFIXED,
];



export class TerminalKeywordOther extends Terminal {
	static readonly instance: TerminalKeywordOther = new TerminalKeywordOther();
	random(): Keyword {
		return Util.arrayRandom(KEYWORD_OTHER);
	}
	match(candidate: Token): boolean {
		return candidate instanceof TOKEN.TokenKeyword && (KEYWORD_OTHER as string[]).includes(candidate.source);
	}
}
