import type {VALUE} from './index.js';



/**
 * Comparator function for checking “sameness” of `Type#values` set elements.
 * Values should be “the same” iff they are identical per the Counterpoint specification.
 */
export const languageValuesIdentical = (a: VALUE.Value, b: VALUE.Value): boolean => a.identical(b);



export const language_values_equal = (a: VALUE.Value, b: VALUE.Value): boolean => a.equal(b);
