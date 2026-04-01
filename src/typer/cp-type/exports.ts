import * as VALUE from '../cp-value/index.ts';
import type {Type} from './Type.ts';
import {Union} from './Union.ts';
import type {Unit} from './Unit.ts';
import {Never} from './Never.ts';
import {Unknown} from './Unknown.ts';
import {Boolean as TypeBoolean} from './Boolean.ts';
import {Symbol as TypeSymbol} from './Symbol.ts';
import {Integer} from './Integer.ts';
import {Float} from './Float.ts';
import {String as TypeString} from './String.ts';
import {Object as TypeObject} from './Object.ts';



/** The Bottom Type, containing no values. */ export const NEVER:   Never            = new Never();
/** The Top Type, containing all values.   */ export const UNKNOWN: Unknown          = new Unknown();
/** The Null Type.                         */ export const NULL:    Unit<VALUE.Null> = VALUE.NULL.toType();
/** The Boolean Type.                      */ export const BOOL:    TypeBoolean      = new TypeBoolean();
/** The Symbol Type.                       */ export const SYM:     TypeSymbol       = new TypeSymbol();
/** The Integer Type.                      */ export const INT:     Integer          = new Integer();
/** The Float Type.                        */ export const FLOAT:   Float            = new Float();
/** The String Type.                       */ export const STR:     TypeString       = new TypeString();
/** The Object Type.                       */ export const OBJ:     TypeObject       = new TypeObject();



/** A Unit Type containing only the Counterpoint Language Value `false`. */
export const FALSE: Unit<VALUE.Boolean> = VALUE.FALSE.toType();

/** A Unit Type containing only the Counterpoint Language Value `true`. */
export const TRUE: Unit<VALUE.Boolean> = VALUE.TRUE.toType();

/** A Unit Type containing only the Counterpoint Language Value `@never`. */
export const SYM_NEVER: Unit<VALUE.Symbol> = VALUE.SYM_NEVER.toType();



export const FALSY_TYPES: ReadonlySet<Type> = new Set([NULL, FALSE]);



export const TYPE_CONSTANTS = [
	NULL,
	BOOL,
	SYM,
	INT,
	FLOAT,
	STR,
	OBJ,
	FALSE,
	TRUE,
	SYM_NEVER,
] as const;



export const NUMBER: Type = Union.all(INT, FLOAT); // needs to be defined after `TYPE_CONSTANTS` because `Type#union` has a decorator that relies on it
