import {OBJ} from './package.js';
import {Type} from './Type.js';



export class TypeMap extends Type {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeMap object.
	 * @param antecedenttypes a union of antecedent types in this map type
	 * @param consequenttypes a union of consequent types in this map type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly antecedenttypes: Type,
		readonly consequenttypes: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.Map()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.antecedenttypes.hasMutable || this.consequenttypes.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Map.<${ this.antecedenttypes }, ${ this.consequenttypes }>`;
	}

	override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.Map && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(Type.OBJ) || (
			t instanceof TypeMap
			&& ((t.isMutable)
				? this.isMutable && this.antecedenttypes.equals(t.antecedenttypes) && this.consequenttypes.equals(t.consequenttypes)
				: this.antecedenttypes.isSubtypeOf(t.antecedenttypes) && this.consequenttypes.isSubtypeOf(t.consequenttypes)
			)
		);
	}

	override mutableOf(): TypeMap {
		return new TypeMap(this.antecedenttypes, this.consequenttypes, true);
	}

	override immutableOf(): TypeMap {
		return new TypeMap(this.antecedenttypes, this.consequenttypes, false);
	}
}
