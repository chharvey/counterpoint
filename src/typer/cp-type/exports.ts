import * as VALUE from '../cp-value/index.ts';
import type {Type} from './Type.ts';
import type {Unit} from './Unit.ts';
import {Nothing} from './Nothing.ts';
import {Anything} from './Anything.ts';
import {Boolean as TypeBoolean} from './Boolean.ts';
import {Symbol as TypeSymbol} from './Symbol.ts';
import {Integer} from './Integer.ts';
import {Float} from './Float.ts';
import {String as TypeString} from './String.ts';
import {Object as TypeObject} from './Object.ts';



/** The Counterpoint Language Nothing  Type `nothing`.  */ export const NOTHING:  Nothing          = new Nothing();
/** The Counterpoint Language Anything Type `anything`. */ export const ANYTHING: Anything         = new Anything();
/** The Counterpoint Language Null     Type `null`.     */ export const NULL:     Unit<VALUE.Null> = VALUE.NULL.toType();
/** The Counterpoint Language Boolean  Type `bool`.     */ export const BOOL:     TypeBoolean      = new TypeBoolean();
/** The Counterpoint Language Symbol   Type `sym`.      */ export const SYM:      TypeSymbol       = new TypeSymbol();
/** The Counterpoint Language Integer  Type `int`.      */ export const INT:      Integer          = new Integer();
/** The Counterpoint Language Float    Type `float`.    */ export const FLOAT:    Float            = new Float();
/** The Counterpoint Language String   Type `str`.      */ export const STR:      TypeString       = new TypeString();
/** The Counterpoint Language Object   Type `Object`.   */ export const OBJ:      TypeObject       = new TypeObject();



/** A Unit Type containing only the Counterpoint Language Value `false`. */
export const FALSE: Unit<VALUE.Boolean> = VALUE.FALSE.toType();

/** A Unit Type containing only the Counterpoint Language Value `true`. */
export const TRUE: Unit<VALUE.Boolean> = VALUE.TRUE.toType();

/** A Unit Type containing only the Counterpoint Language Value `@nothing`. */
export const SYM_NOTHING: Unit<VALUE.Symbol> = VALUE.SYM_NOTHING.toType();



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
	SYM_NOTHING,
] as const;
