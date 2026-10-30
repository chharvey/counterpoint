import {
	strictEqual,
	instanceOf,
	memoizeBinOp,
} from '../utils-private.ts';
import * as VALUE from '../value/index.ts';
import {
	subtypeLaws,
	type Type,
} from './Type.ts';
import {
	isObjectType,
	ReferenceType,
} from './ReferenceType.ts';
import {Tuple} from './Tuple.ts';
import {Record} from './Record.ts';



/**
 * Class for constructing a `Function` type.
 * @final
 */
class TypeFunction extends ReferenceType {
	/**
	 * Construct a new TypeFunction object.
	 * @param typeargParamsPosit the types of the positional parameters
	 * @param typeargParamsNamed the types of the named parameters
	 * @param typearg_return     the return type
	 */
	public constructor(
		private readonly typeargParamsPosit: Tuple  = new Tuple(),
		private readonly typeargParamsNamed: Record = new Record(),
		private readonly typearg_return?: Type,
	) {
		super();
	}


	public get minArity(): bigint {
		return this.typeargParamsPosit.minCount + this.typeargParamsNamed.minCount;
	}


	public override toString(): string {
		const posit_params: string = this.typeargParamsPosit.typeargs.length > 1
			? this.typeargParamsPosit.toString().slice(1, -1)
			: this.typeargParamsPosit.typeargs.length
				? this.typeargParamsPosit.toString().slice(1, -2)
				: '';
		const named_params: string = this.typeargParamsNamed.typeargs.size
			? this.typeargParamsNamed.toString().slice(1, -1)
			: '';
		return `\\(${[posit_params, named_params].filter((p) => !!p).join(', ')}) => ${this.typearg_return ?? 'void'}`;
	}

	@instanceOf(() => VALUE.Function)
	public override includes(v: VALUE.Value): boolean {
		return v.toType().isSubtypeOf(this);
	}

	@strictEqual
	@memoizeBinOp()
	@subtypeLaws
	@isObjectType
	@instanceOf(() => TypeFunction)
	public override isSubtypeOf(t: Type): boolean {
		// Contravariance for parameter types: `A >: B --> \(A) => R <: \(B) => R`.
		// Covariance     for return type:     `A <: B --> \(P) => A <: \(P) => B`.
		const this_return: Type | undefined = this.typearg_return;
		const that_return: Type | undefined = (t as TypeFunction).typearg_return;
		return (
			(t as TypeFunction).isMoreSpecificThan(this) &&
			(
				!this_return && !that_return ||
				!!that_return && !!this_return?.isSubtypeOf(that_return)
			)
		);
	}

	public override mutableOf(): Type {
		return this;
	}

	/**
	 * A function type F1 is “more specific than” another function type F2 iff:
	 * for every parameter entry `p2` in `F2`, there exists a corresponsding parameter entry `p1` in `F1`
	 * such that `p1.type.isSubtypeOf(p2.type)`.
	 * This is used when validating and dispatching function overloads.
	 * @param t the function type to check
	 * @return  true if this is “more specific than” the argument
	 */
	public isMoreSpecificThan(t: TypeFunction): boolean {
		return (
			this.typeargParamsPosit.isSubtypeOf(t.typeargParamsPosit) &&
			this.typeargParamsNamed.isSubtypeOf(t.typeargParamsNamed)
		);
	}
}
export {TypeFunction as Function};
