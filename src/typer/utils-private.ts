import type {OBJ} from './index.js';



/**
 * Comparator function for checking “sameness” of `Type#values` set elements.
 * Values should be “the same” iff they are identical per the Counterpoint specification.
 */
export const languageValuesIdentical = (a: OBJ.Value, b: OBJ.Value): boolean => a.identical(b);



export const language_values_equal = (a: OBJ.Value, b: OBJ.Value): boolean => a.equal(b);
