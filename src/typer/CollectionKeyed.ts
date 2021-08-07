import {VoidError01} from '../error/index.js';
import type {AST} from '../validator/index.js';
import type {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {SolidBoolean} from './SolidBoolean.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - SolidRecord
 */
export abstract class CollectionKeyed<T extends SolidObject = SolidObject> extends Collection {
	constructor (
		protected readonly properties: ReadonlyMap<bigint, T> = new Map(),
	) {
		super();
	}

	/** @final */
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.properties.size === 0);
	}

	override toString(): string {
		return `[${ [...this.properties].map(([key, value]) => `${ key }n= ${ value }`).join(', ') }]`;
	}

	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		return (
			value instanceof CollectionKeyed
			&& this.properties.size === value.properties.size
			&& Collection.do_Equal<CollectionKeyed>(this, value, () => [...(value as CollectionKeyed).properties].every(
				([thatkey, thatvalue]) => !!this.properties.get(thatkey)?.equal(thatvalue),
			))
		);
	}

	/** @final */
	get(key: bigint, access_optional: boolean, accessor: AST.ASTNodeKey): T | SolidNull {
		return (this.properties.has(key))
			? this.properties.get(key)!
			: (access_optional)
				? SolidNull.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
