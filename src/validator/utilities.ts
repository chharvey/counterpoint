import {
	TypeError03,
	SolidType,
	SolidNumber,
	Int16,
	Float64,
} from './package.js';
import type {
	ASTNodeDeclarationVariable,
	ASTNodeAssignment,
	Validator,
} from './index.js';



export function bothNumeric(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(SolidNumber) && t1.isSubtypeOf(SolidNumber)
}
export function eitherFloats(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(Float64) || t1.isSubtypeOf(Float64)
}
export function bothFloats(t0: SolidType, t1: SolidType): boolean {
	return t0.isSubtypeOf(Float64) && t1.isSubtypeOf(Float64)
}
export function neitherFloats(t0: SolidType, t1: SolidType): boolean {
	return !eitherFloats(t0, t1)
}
export function oneFloats(t0: SolidType, t1: SolidType): boolean {
	return !neitherFloats(t0, t1) && !bothFloats(t0, t1)
}



/** Implementation of `xjs.Array.forEachAggregated` until it is released. */
export function forEachAggregated<T>(array: readonly T[], callback: (item: T) => void): void {
	const errors: readonly Error[] = array.map((it) => {
		try {
			callback(it);
			return null;
		} catch (err) {
			return (err instanceof Error) ? err : new Error(`${ err }`);
		}
	}).filter((e): e is Error => e instanceof Error);
	if (errors.length) {
		throw (errors.length === 1)
			? errors[0]
			: new AggregateError(errors, errors.map((err) => err.message).join('\n'));
	}
}
/** Implementation of `xjs.Array.mapAggregated` until it is released. */
export function mapAggregated<T, U>(array: readonly T[], callback: (item: T) => U): U[] {
	const successes: U[]     = [];
	const errors:    Error[] = [];
	array.forEach((it) => {
		let success: U;
		try {
			success = callback(it);
		} catch (err) {
			errors.push((err instanceof Error) ? err : new Error(`${ err }`));
			return;
		}
		successes.push(success);
	});
	if (errors.length) {
		throw (errors.length === 1)
			? errors[0]
			: new AggregateError(errors, errors.map((err) => err.message).join('\n'));
	} else {
		return successes;
	}
}



/**
 * Type-check an assignment.
 * @param assignment    either a variable declaration or a reassignment
 * @param assignee_type the type of the assignee (the variable or bound property being reassigned)
 * @param assigned_type the type of the expression assigned
 * @param validator     a validator
 * @throws {TypeError03} if the assigned expression is not assignable to the assignee
 */
export function typeCheckAssignment(
	assignment:    ASTNodeDeclarationVariable | ASTNodeAssignment,
	assignee_type: SolidType,
	assigned_type: SolidType,
	validator:     Validator,
): void {
	const treatIntAsSubtypeOfFloat: boolean = (
		   validator.config.compilerOptions.intCoercion
		&& assigned_type.isSubtypeOf(Int16)
		&& Float64.isSubtypeOf(assignee_type)
	);
	if (!assigned_type.isSubtypeOf(assignee_type) && !treatIntAsSubtypeOfFloat) {
		throw new TypeError03(assignment, assignee_type, assigned_type);
	}
}
