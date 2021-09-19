import {
	TokenComment,
} from '@chharvey/parser';



export class TokenCommentLine extends TokenComment {
	static readonly DELIM_START: '%'  = '%'
	static readonly DELIM_END:   '\n' = '\n'
}
