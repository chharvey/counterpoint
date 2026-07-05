import type {Type} from './Type.ts';
import {TypeOperation} from './TypeOperation.ts';



/**
 * Known subclasses:
 * - Intersection
 * - Union
 */
export abstract class Combinable extends TypeOperation {
	/** @final */
	public override get isReference(): boolean {
		return this.operands.some((s) => s.isReference);
	}

	public abstract normalize(): Type;

	public abstract denormalize(): Type;
}
