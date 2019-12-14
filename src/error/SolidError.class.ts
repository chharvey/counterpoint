type ErrorConstructorProperties = {
	message     : string,
	name       ?: string,
	code       ?: number,
	line_index ?: number,
	col_index  ?: number,
};

export default class SolidError extends Error {
	static readonly NAME: string = 'Error'
	readonly code       : number;
	readonly line_index : number|null;
	readonly col_index  : number|null;
	constructor (message: string);
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
