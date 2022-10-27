import {OBJ} from './package.js';
import {Type} from './Type.js';



export class TypeList extends Type {
	public override readonly isBottomType: boolean = false;

	/**
	 * Construct a new TypeList object.
	 * @param types a union of types in this list type
	 * @param is_mutable is this type mutable?
	 */
	 public constructor(
		public readonly types: Type,
		is_mutable: boolean = false,
	) {
		super(is_mutable, new Set([new OBJ.List()]));
	}

	public override get hasMutable(): boolean {
		return super.hasMutable || this.types.hasMutable;
	}

	public override toString(): string {
		return `${ (this.isMutable) ? 'mutable ' : '' }List.<${ this.types }>`;
	}

	public override includes(v: OBJ.Object): boolean {
		return v instanceof OBJ.List && v.toType().isSubtypeOf(this);
	}

	protected override isSubtypeOf_do(t: Type): boolean {
		return t.equals(Type.OBJ) || (
			t instanceof TypeList
			&& ((t.isMutable)
				? this.isMutable && this.types.equals(t.types)
				: this.types.isSubtypeOf(t.types)
			)
		);
	}

	public override mutableOf(): TypeList {
		return new TypeList(this.types, true);
	}

	public override immutableOf(): TypeList {
		return new TypeList(this.types, false);
	}
}
