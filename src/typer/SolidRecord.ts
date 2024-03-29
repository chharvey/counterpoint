import {SolidTypeRecord} from './SolidTypeRecord.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class SolidRecord<T extends SolidObject = SolidObject> extends CollectionKeyed<T> {
	override toType(): SolidTypeRecord {
		return SolidTypeRecord.fromTypes(new Map([...this.properties].map(([key, val]) => [key, val.toType()])));
	}
}
