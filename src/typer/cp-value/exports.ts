import {Keyword} from '../../parser/index.ts';
import {Null} from './Null.ts';
import {Boolean as ValueBoolean} from './Boolean.ts';
import {Symbol as ValueSymbol} from './Symbol.ts';
import {Integer} from './Integer.ts';
import {Float} from './Float.ts';
import {String as ValueString} from './String.ts';



/** The Counterpoint Language Null    Value `null`.     */ export const NULL:        Null         = new Null();
/** The Counterpoint Language Boolean Value `false`.    */ export const FALSE:       ValueBoolean = new ValueBoolean();
/** The Counterpoint Language Boolean Value `true`.     */ export const TRUE:        ValueBoolean = new ValueBoolean(true);
/** The Counterpoint Language Symbol  Value `@nothing`. */ export const SYM_NOTHING: ValueSymbol  = new ValueSymbol(0x80n, Keyword.NOTHING);
/** The Counterpoint Language Integer Value `0`.        */ export const INT_0:       Integer      = new Integer();
/** The Counterpoint Language Integer Value `1`.        */ export const INT_1:       Integer      = new Integer(1n);
/** The Counterpoint Language Float   Value `0.0`.      */ export const FLOAT_0:     Float        = new Float();
/** The Counterpoint Language Float   Value `-0.0`.     */ export const FLOAT_N0:    Float        = new Float(-0.0);
/** The Counterpoint Language Float   Value `1.0`.      */ export const FLOAT_1:     Float        = new Float(1.0);
/** The Counterpoint Language String  Value `''`.       */ export const STR_EMPTY:   ValueString  = new ValueString();
