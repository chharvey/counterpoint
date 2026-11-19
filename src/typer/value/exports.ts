import {Null} from './Null.ts';
import {Boolean as ValueBoolean} from './Boolean.ts';
import {Integer} from './Integer.ts';
import {Natural} from './Natural.ts';



/** The Counterpoint Language Null    Value `null`.  */ export const NULL  = new Null();
/** The Counterpoint Language Boolean Value `false`. */ export const FALSE = new ValueBoolean();
/** The Counterpoint Language Boolean Value `true`.  */ export const TRUE  = new ValueBoolean(true);
/** The Counterpoint Language Integer Value `0`.     */ export const INT_0 = new Integer();
/** The Counterpoint Language Integer Value `1`.     */ export const INT_1 = new Integer(1n);
/** The Counterpoint Language Natural Value `+0`.    */ export const NAT_0 = new Natural();
/** The Counterpoint Language Natural Value `+1`.    */ export const NAT_1 = new Natural(1n);
