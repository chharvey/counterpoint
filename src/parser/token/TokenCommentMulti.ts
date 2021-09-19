import {
	TokenComment,
} from '@chharvey/parser';



export class TokenCommentMulti extends TokenComment {
	static readonly DELIM_START: '%%' = '%%'
	static readonly DELIM_END:   '%%' = '%%'
}
