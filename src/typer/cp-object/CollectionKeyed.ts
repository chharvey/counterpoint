import {VoidError01} from '../../index.js';
import {
	throw_expression,
	strictEqual,
} from '../../lib/index.js';
import type {AST} from '../../validator/index.js';
import {Object as CPObject} from './Object.js';
import {Null} from './Null.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - Record
 * - Dict
 */
export abstract class CollectionKeyed<T extends CPObject = CPObject> extends Collection {
	public constructor(public readonly properties: ReadonlyMap<bigint, T> = new Map()) {
		super();
	}

	/** @final */
	public override get isEmpty(): boolean {
		return this.properties.size === 0;
	}

	public override toString(): string {
		return `[${ [...this.properties].map(([key, value]) => `${ key }n= ${ value }`).join(', ') }]`;
	}

	/** @final */
	@strictEqual
	@CPObject.equalsDeco
	public override equal(value: CPObject): boolean {
		return (
			   value instanceof CollectionKeyed
			&& this.properties.size === value.properties.size
			&& this.isEqualTo(value as this, (this_, that_) => (
				[...that_.properties].every(([thatkey, thatvalue]) => !!this_.properties.get(thatkey)?.equal(thatvalue))
			))
		);
	}

	/** @final */
	public get(key: bigint, access_optional: boolean, accessor: AST.ASTNodeKey): T | Null {
		return (this.properties.has(key))
			? this.properties.get(key)!
			: (access_optional)
				? Null.NULL
				: throw_expression(new VoidError01(accessor));
	}
}
