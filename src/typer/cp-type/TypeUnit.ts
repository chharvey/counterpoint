import {strictEqual} from '../../lib/index.js';
import type * as OBJ from '../cp-object/index.js';
import {Type} from './Type.js';



/**
 * Class for constructing unit types, types that contain exactly one value.
 * @typeparam Value the type of value this unit type holds
 */
export class TypeUnit<Value extends OBJ.Primitive = OBJ.Primitive> extends Type {
	public override readonly isReference:  boolean = false;
	public override readonly isBottomType: boolean = false;
	public override readonly isTopType:    boolean = false;

	/**
	 * Construct a new TypeUnit object.
	 * @param value the Counterpoint Language Value contained in this Type
	 */
	public constructor(public readonly value: Value) {
		super(false, new Set([value]));
	}

	public override toString(): string {
		return this.value.toString();
	}

	public override includes(v: OBJ.Object): boolean {
		return this.value.identical(v);
	}

	@strictEqual
	@Type.subtypeDeco
	public override isSubtypeOf(t: Type): boolean {
		return t.includes(this.value);
	}
}
