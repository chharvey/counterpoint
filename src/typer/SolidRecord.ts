import type {SolidType} from './SolidType';
import {SolidObject} from './SolidObject';
import {SolidBoolean} from './SolidBoolean';



export class SolidRecord<T extends SolidObject> extends SolidObject {
	static override toString(): string {
		return 'Record';
	}
	static override values: SolidType['values'] = new Set([new SolidRecord()]);


	constructor (
		readonly properties: ReadonlyMap<bigint, T> = new Map(),
	) {
		super();
	}
	override toString(): string {
		return `[${ [...this.properties].map(([key, value]) => `${ key.toString() }n= ${ value.toString() }`).join(', ') }]`;
	}
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.properties.size === 0);
	}
}
