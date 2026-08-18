import {Null} from './Null.ts';
import {Boolean as ValueBoolean} from './Boolean.ts';
import {Integer} from './Integer.ts';
import {Natural} from './Natural.ts';



/** The Counterpoint Language Null    Value `null`.  */ export const NULL:  Null         = new Null();
/** The Counterpoint Language Boolean Value `false`. */ export const FALSE: ValueBoolean = new ValueBoolean();
/** The Counterpoint Language Boolean Value `true`.  */ export const TRUE:  ValueBoolean = new ValueBoolean(true);
/** The Counterpoint Language Integer Value `0`.     */ export const INT_0: Integer      = new Integer();
/** The Counterpoint Language Integer Value `1`.     */ export const INT_1: Integer      = new Integer(1n);
/** The Counterpoint Language Natural Value `+0`.    */ export const NAT_0: Natural      = new Natural();
/** The Counterpoint Language Natural Value `+1`.    */ export const NAT_1: Natural      = new Natural(1n);
