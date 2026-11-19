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



export function runOncePerNode<ProtoThis extends object, Param extends AstNode>(
	method:   (this: ProtoThis, arg: Param) => void,
	_context: ClassMethodDecoratorContext<ProtoThis, typeof method>,
): typeof method {
	const memoset = new WeakSet<Param>();
	return function (arg) {
		if (!memoset.has(arg)) {
			memoset.add(arg);
			return method.call(this, arg);
		}
	};
}
