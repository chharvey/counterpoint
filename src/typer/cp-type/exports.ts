import * as VALUE from '../cp-value/index.js';
import type {TypeUnit} from './Unit.js';
import {TypeNever} from './Never.js';
import {TypeVoid} from './Void.js';
import {TypeUnknown} from './Unknown.js';
import {TypeBoolean} from './Boolean.js';
import {TypeInteger} from './Integer.js';
import {TypeFloat} from './Float.js';
import {TypeString} from './String.js';
import {TypeObject} from './Object.js';



/** The Bottom Type, containing no values. */                    export const NEVER:   TypeNever            = new TypeNever();
/** The Void Type, representing a completion but not a value. */ export const VOID:    TypeVoid             = new TypeVoid();
/** The Top Type, containing all values. */                      export const UNKNOWN: TypeUnknown          = new TypeUnknown();
/** The Null Type. */                                            export const NULL:    TypeUnit<VALUE.Null> = VALUE.Null.NULLTYPE;
/** The Boolean Type. */                                         export const BOOL:    TypeBoolean          = new TypeBoolean();
/** The Integer Type. */                                         export const INT:     TypeInteger          = new TypeInteger();
/** The Float Type. */                                           export const FLOAT:   TypeFloat            = new TypeFloat();
/** The String Type. */                                          export const STR:     TypeString           = new TypeString();
/** The Object Type. */                                          export const OBJ:     TypeObject           = new TypeObject();
