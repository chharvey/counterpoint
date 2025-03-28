import type {Type} from './Type.js';
import {TypeOperation} from './TypeOperation.js';



/**
 * Known subclasses:
 * - Intersection
 * - Union
 */
export abstract class Combinable extends TypeOperation {
	public abstract normalize(): Type;

	public abstract denormalize(): Type;

	public abstract combineTuplesOrRecords(): Type;
}
