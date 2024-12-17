import * as assert from 'assert';
import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	OBJ,
	TYPE,
	ErrorCode,
} from '../../index.js';
import type {
	ASTNodeExpression,
	ASTNodeCollectionLiteralMutable,
} from './index.js';



/**
 * Executes a callback on each item of an array until that callback returns.
 * If the callback throws, the error is saved, and execution proceeds to the next iteration.
 * If any iteration returns, this method returns and the errors are discarded.
 * If all iterations throw, the errors are collected into a single AggregateError, which is then thrown.
 *
 * The “dual” of {@link Array#forEach} — this method returns as soon as a callback call is successful; otherwise throws.
 *
 * Similar to {@link Promise.any}, but synchronous.
 *
 * @typeparam T                the type of items in the array
 * @param     array            the array of items
 * @param     callback         the function to call on each item
 * @throws    {AggregateError} if two or more iterations throws an error
 * @throws    {Error}          if one iteration throws an error
 */
function forEither<T>(array: readonly T[], callback: (item: T, i: number, src: readonly T[]) => void): void {
	const thrown: Error[] = [];
	try {
		array.forEach((it, i, src) => {
			try {
				callback.call(null, it, i, src);
			} catch (e) {
				thrown.push(e as Error);
				return;
			}
			throw 'success';
		});
	} catch {
		return;
	}
	throw (
		thrown.length >= 2 ? new AggregateError(thrown) :
		thrown.length      ? thrown[0] :
		new Error('An unexpected error occurred.')
	);
}



/**
 * Decorator for {@link ASTNodeExpression#build} method and any overrides.
 * First tries to compute the assessed value, and if successful, builds the assessed value.
 * Otherwise builds this node.
 * @implements MethodDecorator<ASTNodeExpression, ASTNodeExpression['build']>
 */
export function buildDeco(
	method:   ASTNodeExpression['build'],
	_context: ClassMethodDecoratorContext<ASTNodeExpression, typeof method>,
): typeof method {
	return function (this: ASTNodeExpression) {
		const value: OBJ.Object | null      = this.validator.config.compilerOptions.constantFolding ? this.fold() : null;
		const built: binaryen.ExpressionRef = value?.build(this.builder.module) ?? method.call(this);
		assert.strictEqual(binaryen.getExpressionType(built), binaryen.v128);
		return built;
	};
}



/**
 * Decorator for {@link ASTNodeExpression#type} method and any overrides.
 * Type-checks and re-throws any type errors first,
 * then computes assessed value (if applicable), and if successful,
 * returns a constant type equal to that assessed value.
 * @implements MethodDecorator<ASTNodeExpression, ASTNodeExpression['type']>
 */
export function typeDeco(
	method:   ASTNodeExpression['type'],
	_context: ClassMethodDecoratorContext<ASTNodeExpression, typeof method>,
): typeof method {
	return function (this: ASTNodeExpression) {
		const type: TYPE.Type = method.call(this); // type-check first, to re-throw any TypeErrors
		if (this.validator.config.compilerOptions.constantFolding) {
			let value: OBJ.Object | null = null;
			try {
				value = this.fold();
			} catch (err) {
				if (err instanceof ErrorCode) {
					// ignore evaluation errors such as VoidError, NanError, etc.
					return TYPE.NEVER;
				} else {
					throw err;
				}
			}
			if (!!value && value instanceof OBJ.Primitive) {
				return value.toType();
			}
		}
		return type;
	};
}



/**
 * Decorator for {@link ASTNodeCollectionLiteralMutable#assignTo} method and any overrides.
 * Simplifies assignments by handling type operations.
 * @implements MethodDecorator<ASTNodeCollectionLiteralMutable, ASTNodeCollectionLiteralMutable['assignTo']>
 */
export function assignToDeco(
	method:   ASTNodeCollectionLiteralMutable['assignTo'],
	_context: ClassMethodDecoratorContext<ASTNodeCollectionLiteralMutable, typeof method>,
): typeof method {
	return function (this: ASTNodeCollectionLiteralMutable, assignee, err) {
		if (assignee instanceof TYPE.TypeIntersection) {
			/* A value is assignable to a type intersection if and only if
			it is assignable to all operands of that intersection. */
			return xjs.Array.forEachAggregated(assignee.operands, (s) => this.assignTo(s, err));
		} else if (assignee instanceof TYPE.TypeUnion) {
			/* A value is assignable to a type union if and only if
			it is assignable to any operand of that union. */
			return forEither(assignee.operands, (s) => this.assignTo(s, err));
		} else {
			return method.call(this, assignee, err);
		}
	};
}
