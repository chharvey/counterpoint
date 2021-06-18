import type {SolidType} from './SolidType';
import {SolidObject} from './SolidObject';



export class SolidMapping<K extends SolidObject, V extends SolidObject> extends SolidObject {
	static override values: SolidType['values'] = new Set([new SolidMapping()]);


	constructor (
		readonly cases: ReadonlyMap<K, V> = new Map(),
	) {
		super();
	}
}
