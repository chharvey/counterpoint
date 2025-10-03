import type {Type} from './Type.ts';
import {TypeOperation} from './TypeOperation.ts';



/**
 * Known subclasses:
 * - Intersection
 * - Union
 */
export abstract class Combinable extends TypeOperation {
	public abstract normalize(): Type;

	public abstract denormalize(): Type;
}
