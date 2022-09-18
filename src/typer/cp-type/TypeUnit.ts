import {
	strictEqual,
	OBJ,
} from './package.js';
import {Type} from './Type.js';



/**
 * Class for constructing unit types, types that contain exactly one value.
 * @typeparam Value the type of value this unit type holds
 */
export class TypeUnit<Value extends OBJ.Object = OBJ.Object> extends Type {
	override readonly isBottomType: boolean = false;
	override readonly isTopType:    boolean = false;

	/**
	 * Construct a new TypeUnit object.
	 * @param value the Counterpoint Language Value contained in this Type
	 */
	constructor (
		readonly value: Value,
	) {
		super(false, new Set([value]));
	}

	override toString(): string {
		return this.value.toString();
	}
	override includes(v: OBJ.Object): boolean {
		return this.value.identical(v);
	}
	@strictEqual
	@Type.subtypeDeco
	override isSubtypeOf(t: Type): boolean {
		return t.includes(this.value);
	}
}
