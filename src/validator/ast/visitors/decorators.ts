import type {AstNode} from '../index.ts';



export function memoizePerNode<ProtoThis extends object, Param extends AstNode, Return>(
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
