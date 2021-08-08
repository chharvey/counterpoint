import {
	SolidType,
	SolidTypeConstant,
} from './SolidType.js';
import {SolidTypeList} from './SolidTypeList.js';
import type {SolidObject} from './SolidObject.js';
import {CollectionIndexed} from './CollectionIndexed.js';



export class SolidList<T extends SolidObject = SolidObject> extends CollectionIndexed<T> {
	static override toString(): string {
		return 'List';
	}
	static override values: SolidType['values'] = new Set([new SolidList()]);

	override toString(): string {
		return `${ SolidList/*static*/ }.(${ super.toString() })`;
	}
	override toType(): SolidTypeList {
		return new SolidTypeList(
			(this.items.length)
				? this.items.map<SolidType>((el) => new SolidTypeConstant(el)).reduce((a, b) => a.union(b))
				: SolidType.NEVER,
		);
	}
}
