import {
	SolidType,
	SolidTypeUnit,
	SolidTypeList,
} from './cp-type/index.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class SolidList<T extends SolidObject = SolidObject> extends CollectionIndexed<T> {
	override toString(): string {
		return `List.(${ super.toString() })`;
	}
	override toType(): SolidTypeList {
		return new SolidTypeList(
			(this.items.length)
				? SolidType.unionAll(this.items.map<SolidType>((el) => new SolidTypeUnit(el)))
				: SolidType.NEVER,
		);
	}
}
