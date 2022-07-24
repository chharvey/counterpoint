import {
	SolidType,
	SolidTypeUnit,
	SolidTypeDict,
} from './package.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionKeyed} from './CollectionKeyed.js';



export class SolidDict<T extends SolidObject = SolidObject> extends CollectionKeyed<T> {
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
