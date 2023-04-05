type ErrorCodeConstructorProperties = {
	/** A message to the user. */
	readonly message: string,
	/**
	 * The name of the error.
	 * @default ErrorCode.NAME
	 */
	readonly name?: string,
	/**
	 * The error number.
	 * @default 0
	 */
	readonly code?: number,
	/**
	 * The line index in source code.
	 * @default null
	 */
	readonly line_index?: number,
	/**
	 * The column index in source code.
	 * @default null
	 */
	readonly col_index?: number,
};



/**
 * Known subclasses:
 * - LexError
 * - ParseError
 * - ReferenceError
 * - AssignmentError
 * - TypeError
 * - MutabilityError
 * - VoidError
 * - NanError
 */
export class ErrorCode extends Error {
	/** The name of this class of errors. */
	static readonly #NAME = 'Error';


	/** The name of this error. */
	public declare readonly name: string;
	/** A message to the user. */
	public declare readonly message: string;

	/** The error number. */
	public readonly code: number;
	/**
	 * The (zero-based) line index of the source code that caused the error.
	 * `null` if the line number cannot be determined.
	 */
	public readonly line_index: number | null;
	/**
	 * The (zero-based) column index of the source code that caused the error.
	 * `null` if the column number cannot be determined.
	 */
	public readonly col_index: number | null;

	/**
	 * Construct a new ErrorCode object.
	 * @param  message a message to the user
	 */
	public constructor(message: string);
	/**
	 * Construct a new ErrorCode object.
	 * @param props the properties of the error
	 */
	public constructor(props: ErrorCodeConstructorProperties);
	public constructor(props: string | ErrorCodeConstructorProperties) {
		if (typeof props === 'string') {
			props = {message: props};
		}
		super(props.message);
		this.code       = props.code || 0;
		this.name       = (props.name) ? props.name.concat((this.code) ? `${ this.code }` : '') : ErrorCode.#NAME;
		this.line_index = (props.line_index !== void 0) ? props.line_index : null;
		this.col_index  = (props.col_index  !== void 0) ? props.col_index  : null;
	}
}
