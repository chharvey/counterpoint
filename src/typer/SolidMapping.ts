import type {SolidType} from './SolidType';
import {SolidObject} from './SolidObject';
import {SolidBoolean} from './SolidBoolean';



export class SolidMapping<K extends SolidObject, V extends SolidObject> extends SolidObject {
	static override toString(): string {
		return 'Mapping';
	}
	static override values: SolidType['values'] = new Set([new SolidMapping()]);


	constructor (
		readonly cases: ReadonlyMap<K, V> = new Map(),
	) {
		super();
	}
	override toString(): string {
		return `[${ [...this.cases].map(([ant, con]) => `${ ant.toString() } |-> ${ con.toString() }`).join(', ') }]`;
	}
	override get isEmpty(): SolidBoolean {
		return SolidBoolean.fromBoolean(this.cases.size === 0);
	}
}
