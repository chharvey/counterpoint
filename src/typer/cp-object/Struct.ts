import type {Object as CPObject} from './Object.js';
import {Record} from './Record.js';



export class Struct<T extends CPObject = CPObject> extends Record<T> {
}
