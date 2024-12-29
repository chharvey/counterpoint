import * as VALUE from '../cp-value/index.js';
import type {Unit} from './Unit.js';
import {Never} from './Never.js';
import {Void} from './Void.js';
import {Unknown} from './Unknown.js';
import {Boolean as TypeBoolean} from './Boolean.js';
import {Integer} from './Integer.js';
import {Float} from './Float.js';
import {String as TypeString} from './String.js';
import {Object as TypeObject} from './Object.js';



/** The Bottom Type, containing no values. */                    export const NEVER:   Never            = new Never();
/** The Void Type, representing a completion but not a value. */ export const VOID:    Void             = new Void();
/** The Top Type, containing all values. */                      export const UNKNOWN: Unknown          = new Unknown();
/** The Null Type. */                                            export const NULL:    Unit<VALUE.Null> = VALUE.NULL.toType();
/** The Boolean Type. */                                         export const BOOL:    TypeBoolean      = new TypeBoolean();
/** The Integer Type. */                                         export const INT:     Integer          = new Integer();
/** The Float Type. */                                           export const FLOAT:   Float            = new Float();
/** The String Type. */                                          export const STR:     TypeString       = new TypeString();
/** The Object Type. */                                          export const OBJ:     TypeObject       = new TypeObject();



/** A Unit Type containing only the Counterpoint Language Value `false`. */
export const FALSE: Unit<VALUE.Boolean> = VALUE.FALSE.toType();

/** A Unit Type containing only the Counterpoint Language Value `true`. */
export const TRUE: Unit<VALUE.Boolean> = VALUE.TRUE.toType();
