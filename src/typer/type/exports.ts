import * as VALUE from '../value/index.ts';
import {Union} from './Union.ts';
import {Unit} from './Unit.ts';
import {Nothing} from './Nothing.ts';
import {Anything} from './Anything.ts';
import {Boolean as TypeBoolean} from './Boolean.ts';
import {Symbol as TypeSymbol} from './Symbol.ts';
import {Integer} from './Integer.ts';
import {Natural} from './Natural.ts';
import {Float} from './Float.ts';
import {String as TypeString} from './String.ts';
import {Object as TypeObject} from './Object.ts';



/** The Counterpoint Language Nothing  Type `nothing`.  */ export const NOTHING  = new Nothing();
/** The Counterpoint Language Anything Type `anything`. */ export const ANYTHING = new Anything();
/** The Counterpoint Language Symbol   Type `sym`.      */ export const SYM      = new TypeSymbol();
/** The Counterpoint Language Integer  Type `int`.      */ export const INT      = new Integer();
/** The Counterpoint Language Natural  Type `nat`.      */ export const NAT      = new Natural();
/** The Counterpoint Language Float    Type `float`.    */ export const FLOAT    = new Float();
/** The Counterpoint Language String   Type `str`.      */ export const STR      = new TypeString();
/** The Counterpoint Language Object   Type `Object`.   */ export const OBJ      = new TypeObject();



/** The Counterpoint Language Null Type `null`. */
export const NULL = new Unit<VALUE.Null>(VALUE.NULL);

/** A Unit Type containing only the Counterpoint Language Value `false`. */
export const FALSE = new Unit<VALUE.Boolean>(VALUE.FALSE);

/** A Unit Type containing only the Counterpoint Language Value `true`. */
export const TRUE = new Unit<VALUE.Boolean>(VALUE.TRUE);

/** A Unit Type containing only the Counterpoint Language Value `@nothing`. */
export const SYM_NOTHING = new Unit<VALUE.Symbol>(VALUE.SYM_NOTHING);



/** The Counterpoint Language Boolean Type `bool`. */
export const BOOL = new TypeBoolean(); // NOTE: We would typically just use a `new Union()` here, but we need a class for overriding Union methods to improve performance.

/** The union of all numeric types. */
export const NUMBER = new Union(INT, NAT, FLOAT); // cannot call `Type#union` because it has a decorator that relies on `TYPE_CONSTANTS` below



export const TYPE_CONSTANTS = [
	NULL,
	BOOL,
	SYM,
	INT,
	NAT,
	FLOAT,
	STR,
	OBJ,
	FALSE,
	TRUE,
	SYM_NOTHING,
] as const;
