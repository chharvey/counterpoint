import * as assert from 'assert';
import {VoidError01} from '../../index.js';
import type {AST} from '../../validator/index.js';
import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.js';
import {NULL} from './index.js';
import {
	identical,
	type Value,
} from './Value.js';
import type {Null} from './Null.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - ValueRecord
 * - Dict
 */
export abstract class CollectionKeyed<T extends Value = Value> extends Collection {
	public constructor(public readonly properties: ReadonlyMap<bigint, T> = new Map()) {
		super();
	}

	/**
	 * @final
	 * @implements Value
	 */
	public override get isEmpty(): boolean {
		return this.properties.size === 0;
	}

	public override toString(): string {
		return `[${ [...this.properties].map(([key, value]) => `${ key }n= ${ value }`).join(', ') }]`;
	}

	/** @final */
	@strictEqual
	@instanceOf(() => CollectionKeyed)
	@identical
	@memoizeBinOp(true, true)
	public override equal(value: Value): boolean {
		return (
			this.properties.size === (value as CollectionKeyed).properties.size &&
			[...(value as CollectionKeyed).properties].every(([thatkey, thatvalue]) => !!this.properties.get(thatkey)?.equal(thatvalue))
		);
	}

	/** @final */
	public get(key: bigint, access_optional: boolean, accessor: AST.ASTNodeKey): T | Null {
		return (
			this.properties.has(key) ? this.properties.get(key)! :
			access_optional          ? NULL :
			assert.fail(new VoidError01(accessor))
		);
	}
}
