import type {OBJ} from './index.js';



/**
 * Comparator function for checking “sameness” of `Type#values` set elements.
 * Values should be “the same” iff they are identical per the Counterpoint specification.
 */
export const solidObjectsIdentical = (a: OBJ.SolidObject, b: OBJ.SolidObject): boolean => a.identical(b);
