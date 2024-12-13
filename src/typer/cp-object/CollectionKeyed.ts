import * as assert from 'assert';
import {VoidError01} from '../../index.js';
import {
	strictEqual,
	instanceOf,
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
	@instanceOf(() => CollectionKeyed)
	@CPObject.memoizeSameness
	public override equal(value: CPObject): boolean {
		return (
			this.properties.size === (value as CollectionKeyed).properties.size &&
			[...(value as CollectionKeyed).properties].every(([thatkey, thatvalue]) => !!this.properties.get(thatkey)?.equal(thatvalue))
		);
	}

	/** @final */
	public get(key: bigint, access_optional: boolean, accessor: AST.ASTNodeKey): T | Null {
		return (this.properties.has(key))
			? this.properties.get(key)!
			: (access_optional)
				? Null.NULL
				: assert.fail(new VoidError01(accessor));
	}
}
