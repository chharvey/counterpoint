import {
	SolidObject,
	SolidDict,
} from './package.js';
import {Type} from './Type.js';



export class TypeDict extends Type {
	override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeDict object.
	 * @param types a union of types in this dict type
	 * @param is_mutable is this type mutable?
	 */
	constructor (
		readonly types: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new SolidDict()]));
	}

	override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }Dict.<${ this.types }>`;
	}

	override includes(v: SolidObject): boolean {
		return v instanceof SolidDict && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(Type.OBJ) || (
			t instanceof TypeDict
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	override mutableOf(): TypeDict {
		return new TypeDict(this.types, true);
	}

	override immutableOf(): TypeDict {
		return new TypeDict(this.types, false);
	}
}
