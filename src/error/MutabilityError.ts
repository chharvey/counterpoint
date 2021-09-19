import {
	ErrorCode,
} from '@chharvey/parser';



export class MutabilityError extends ErrorCode {
	static override readonly NAME: string = 'MutabilityError';
	static readonly CODE: number = 2400;
	constructor (message: string, code: number = 0, line?: number, col?: number) {
		super({
			message,
			name:       MutabilityError.NAME,
			code:       MutabilityError.CODE + code,
			line_index: line,
			col_index:  col,
		});
	}
}
