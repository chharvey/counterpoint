import type {SolidObject} from './index.js';



/**
 * Comparator function for checking “sameness” of `Type#values` set elements.
 * Values should be “the same” iff they are identical per the Counterpoint specification.
 */
export const solidObjectsIdentical = (a: SolidObject, b: SolidObject): boolean => a.identical(b);
