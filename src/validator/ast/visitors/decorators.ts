import type * as EXPR from '../expression/index.ts';



export function memoizePerExpr<ProtoThis extends object, Param extends EXPR.Expression, Return>(
	method:   (this: ProtoThis, arg: Param) => Return,
	_context: ClassMethodDecoratorContext<ProtoThis, typeof method>,
): typeof method {
	const memomap = new WeakMap<Param, Return>();
	return function (arg) {
		// TODO: Map#getOrInsertComputed
		memomap.has(arg) || memomap.set(arg, method.call(this, arg));
		return memomap.get(arg)!;
	};
}
