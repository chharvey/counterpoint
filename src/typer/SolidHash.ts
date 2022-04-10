import {SolidType} from './SolidType.js';
import {SolidTypeUnit} from './SolidTypeUnit.js';
import {SolidTypeDict} from './SolidTypeDict.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class SolidHash<T extends SolidObject = SolidObject> extends CollectionKeyed<T> {
	override toString(): string {
		return `Dict.(${ super.toString() })`;
	}
	override toType(): SolidTypeDict {
		return new SolidTypeDict(
			(this.properties.size)
				? SolidType.unionAll([...this.properties.values()].map<SolidType>((value) => new SolidTypeUnit(value)))
				: SolidType.NEVER,
		);
	}
}
