import {OBJ as VALUE} from './package.js';
import type {TypeUnit} from './TypeUnit.js';
import {TypeNever} from './TypeNever.js';
import {TypeVoid} from './TypeVoid.js';
import {TypeUnknown} from './TypeUnknown.js';
import {TypeObject} from './TypeObject.js';
import {TypeBoolean} from './TypeBoolean.js';
import {TypeInteger} from './TypeInteger.js';
import {TypeFloat} from './TypeFloat.js';
import {TypeString} from './TypeString.js';



/** The Bottom Type, containing no values. */                    export const NEVER:   TypeNever            = TypeNever.INSTANCE;
/** The Void Type, representing a completion but not a value. */ export const VOID:    TypeVoid             = TypeVoid.INSTANCE;
/** The Top Type, containing all values. */                      export const UNKNOWN: TypeUnknown          = TypeUnknown.INSTANCE;
/** The Object Type. */                                          export const OBJ:     TypeObject           = TypeObject.INSTANCE;
/** The Null Type. */                                            export const NULL:    TypeUnit<VALUE.Null> = VALUE.Null.NULLTYPE;
/** The Boolean Type. */                                         export const BOOL:    TypeBoolean          = TypeBoolean.INSTANCE;
/** The Integer Type. */                                         export const INT:     TypeInteger          = TypeInteger.INSTANCE;
/** The Float Type. */                                           export const FLOAT:   TypeFloat            = TypeFloat.INSTANCE;
/** The String Type. */                                          export const STR:     TypeString           = TypeString.INSTANCE;
