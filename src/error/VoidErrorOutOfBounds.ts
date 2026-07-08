import type {AST} from '../validator/index.ts';
import type {VALUE} from '../typer/index.ts';
import {VoidError} from './VoidError.ts';


/**
 * A VoidErrorOutOfBounds is thrown when accessing a List/Dict/Map with an index/key out of its bounds or range.
 * @example
 * ["earth", "wind", "fire"].[4]; % VoidErrorOutOfBounds: Index `4` is out of bounds on…
 *
 * [
 * 	socrates=  "earth",
 * 	plato=     "wind",
 * 	aristotle= "fire",
 * ].[@pythagoras]; % VoidErrorOutOfBounds: Key `"pythagoras"` is out of bounds on…
 */
export class VoidErrorOutOfBounds extends VoidError {
	/**
	 * Construct a new VoidErrorOutOfBounds object given a List.
	 * @param manner   - 'index'
	 * @param base     - the value of the List accessed
	 * @param index    - the folded value of the index
	 * @param accessor - the accessing index/expression
	 */
	public constructor(manner: 'index', base: VALUE.CollectionIndexed, index: bigint, accessor: AST.Index | AST.EXPR.Expression);
	/**
	 * Construct a new VoidErrorOutOfBounds object given a Dict.
	 * @param manner   - 'key'
	 * @param base     - the value of the Dict accessed
	 * @param key      - the folded value of the key
	 * @param accessor - the accessing key/expression
	 */
	public constructor(manner: 'key', base: VALUE.CollectionKeyed, key: bigint, accessor: AST.Key | AST.EXPR.Expression);
	/**
	 * Construct a new VoidErrorOutOfBounds object given a Map.
	 * @param manner   - 'key'
	 * @param base     - the value of the Map accessed
	 * @param key      - the folded value of the key
	 * @param accessor - the accessing expression
	 */
	public constructor(manner: 'key', base: VALUE.Map, key: VALUE.Value, accessor: AST.EXPR.Expression);
	public constructor(
		manner:       'index' | 'key',
		base:         VALUE.CollectionIndexed | VALUE.CollectionKeyed | VALUE.Map,
		index_or_key: bigint | VALUE.Value,
		accessor:     AST.Index | AST.Key | AST.EXPR.Expression,
	) {
		super(
			`${ manner[0].toUpperCase() }${ manner.slice(1) } \`${ index_or_key }\` is out of bounds on \`${ base }\`.`,
			VoidError.CODES.get(VoidErrorOutOfBounds),
			accessor.line_index,
			accessor.col_index,
		);
	}
}
