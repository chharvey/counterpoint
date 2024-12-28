import * as VALUE from '../cp-value/index.js';
import type {TypeUnit} from './TypeUnit.js';
import {TypeNever} from './TypeNever.js';
import {TypeVoid} from './TypeVoid.js';
import {TypeUnknown} from './TypeUnknown.js';
import {TypeBoolean} from './TypeBoolean.js';
import {TypeInteger} from './TypeInteger.js';
import {TypeFloat} from './TypeFloat.js';
import {TypeString} from './TypeString.js';
import {TypeObject} from './TypeObject.js';



/** The Bottom Type, containing no values. */                    export const NEVER:   TypeNever            = new TypeNever();
/** The Void Type, representing a completion but not a value. */ export const VOID:    TypeVoid             = new TypeVoid();
/** The Top Type, containing all values. */                      export const UNKNOWN: TypeUnknown          = new TypeUnknown();
/** The Null Type. */                                            export const NULL:    TypeUnit<VALUE.Null> = VALUE.Null.NULLTYPE;
/** The Boolean Type. */                                         export const BOOL:    TypeBoolean          = new TypeBoolean();
/** The Integer Type. */                                         export const INT:     TypeInteger          = new TypeInteger();
/** The Float Type. */                                           export const FLOAT:   TypeFloat            = new TypeFloat();
/** The String Type. */                                          export const STR:     TypeString           = new TypeString();
/** The Object Type. */                                          export const OBJ:     TypeObject           = new TypeObject();
