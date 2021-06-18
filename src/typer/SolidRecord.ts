import type {SolidType} from './SolidType';
import {SolidObject} from './SolidObject';



export class SolidRecord<T extends SolidObject> extends SolidObject {
	static override values: SolidType['values'] = new Set([new SolidRecord()]);


	constructor (
		readonly properties: ReadonlyMap<bigint, T> = new Map(),
	) {
		super();
	}
}
