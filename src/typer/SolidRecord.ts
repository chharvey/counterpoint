import type {AST} from '../validator/index.js';
import {VoidError01} from '../error/index.js';
import {
	SolidType,
	SolidTypeConstant,
} from './SolidType.js';
import {SolidTypeRecord} from './SolidTypeRecord.js';
import type {SolidObject} from './SolidObject.js';
import {SolidNull} from './SolidNull.js';
import {SolidBoolean} from './SolidBoolean.js';
import {Collection} from './Collection.js';



export class SolidRecord<T extends SolidObject = SolidObject> extends Collection {
	static override toString(): string {
		return 'Record';
	}
	static override values: SolidType['values'] = new Set([new SolidRecord()]);


	constructor (
		private readonly properties: ReadonlyMap<bigint, T> = new Map(),
	) {
		super();
	}
	override toString(): string {
		return `[${ [...this.properties].map(([key, value]) => `${ key.toString() }n= ${ value.toString() }`).join(', ') }]`;
	}
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.properties.size === 0);
	}
	/** @final */
	protected override equal_helper(value: SolidObject): boolean {
		return (
			value instanceof SolidRecord
			&& this.properties.size === value.properties.size
			&& Collection.do_Equal<SolidRecord>(this, value, () => [...(value as SolidRecord).properties].every(
				([thatkey, thatvalue]) => !!this.properties.get(thatkey)?.equal(thatvalue),
			))
		);
	}

	override toType(): SolidTypeRecord {
		return SolidTypeRecord.fromTypes(new Map([...this.properties].map(([key, value]) => [key, new SolidTypeConstant(value)])));
	}

	get(key: bigint, access_optional: boolean, accessor: AST.ASTNodeKey): T | SolidNull {
		return (this.properties.has(key))
			? this.properties.get(key)!
			: (access_optional)
				? SolidNull.NULL
				: (() => { throw new VoidError01(accessor); })();
	}
}
