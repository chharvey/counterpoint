import {
	VoidError01,
	throw_expression,
	AST,
} from './package.js';
import type {Object} from './Object.js';
import {Null} from './Null.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - Record
 * - Dict
 */
export abstract class CollectionKeyed<T extends Object = Object> extends Collection {
	constructor(readonly properties: ReadonlyMap<bigint, T> = new Map()) {
		super();
	}

	/** @final */
	override get isEmpty(): boolean {
		return this.properties.size === 0;
	}

	override toString(): string {
		return `[${ [...this.properties].map(([key, value]) => `${ key }n= ${ value }`).join(', ') }]`;
	}

	/** @final */
	protected override equal_helper(value: Object): boolean {
		return (
			value instanceof CollectionKeyed
			&& this.properties.size === value.properties.size
			&& Collection.do_Equal<CollectionKeyed>(this, value, () => (
				[...value.properties].every(([thatkey, thatvalue]) => (
					!!this.properties.get(thatkey)?.equal(thatvalue)
				))
			))
		);
	}

	/** @final */
	get(key: bigint, access_optional: boolean, accessor: AST.ASTNodeKey): T | Null {
		return (this.properties.has(key))
			? this.properties.get(key)!
			: (access_optional)
				? Null.NULL
				: throw_expression(new VoidError01(accessor));
	}
}
