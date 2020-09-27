type ErrorConstructorProperties = {
	message     : string,
	name       ?: string,
	code       ?: number,
	line_index ?: number,
	col_index  ?: number,
};



/**
 * An error raised by the Solid compiler.
 */
export default class SolidError extends Error {
	/** The name of this class of errors. */
	static readonly NAME: string = 'Error'


	/** The name of this error. */
	declare readonly name: string;
	/** A message to the user. */
	declare readonly message: string;

	/** The error number. */
	readonly code: number;
	/**
	 * The (zero-based) line index of the source code that caused the error.
	 * `null` if the line number cannot be determined.
	 */
	readonly line_index: number | null;
	/**
	 * The (zero-based) column index of the source code that caused the error.
	 * `null` if the column number cannot be determined.
	 */
	readonly col_index: number | null;

	/**
	 * Construct a new SolidError object.
	 * @param  message - a message to the user
	 */
	constructor (message: string);
	/**
	 * Construct a new SolidError object.
	 * @param props
	 * @property message    - a message to the user
	 * @property name       - the name of the error           @default SolidError.NAME
	 * @property code       - the error number                @default 0
	 * @property line_index - the line   index in source code @default null
	 * @property col_index  - the column index in source code @default null
	 */
	constructor (props: ErrorConstructorProperties);
	constructor (props: string|ErrorConstructorProperties) {
		if (typeof props === 'string') {
			props = { message: props }
		}
		super(props.message)
		this.code       = props.code || 0
		this.name       = props.name ? `${props.name}${this.code || ''}` : SolidError.NAME
		this.line_index = props.line_index !== void 0 ? props.line_index : null
		this.col_index  = props.col_index  !== void 0 ? props.col_index  : null
	}
}
