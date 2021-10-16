import type {SolidType} from './SolidType.js';
import {SolidTypeConstant} from './SolidTypeUnit.js';
import {SolidTypeRecord} from './SolidTypeRecord.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class SolidRecord<T extends SolidObject = SolidObject> extends CollectionKeyed<T> {
	static override toString(): string {
		return 'Record';
	}
	static override values: SolidType['values'] = new Set([new SolidRecord()]);

	override toType(): SolidTypeRecord {
		return SolidTypeRecord.fromTypes(new Map([...this.properties].map(([key, value]) => [key, new SolidTypeConstant(value)])));
	}
}
