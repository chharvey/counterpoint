import * as xjs from 'extrajs';
import {VoidError01} from '../../index.js';
import {
	throw_expression,
	strictEqual,
} from '../../lib/index.js';
import type {AST} from '../../validator/index.js';
import {language_values_equal} from '../utils-private.js';
import {Object as CPObject} from './Object.js';
import {Null} from './Null.js';
import type {Integer} from './Integer.js';
import {Collection} from './Collection.js';



/**
 * Known subclasses:
 * - Tuple
 * - Vect
 * - List
 */
export abstract class CollectionIndexed<T extends CPObject = CPObject> extends Collection {
	public constructor(public readonly items: readonly T[] = []) {
		super();
	}

	/** @final */
	public override get isEmpty(): boolean {
		return this.items.length === 0;
	}

	public override toString(): string {
		return `[${ this.items.map((it) => it.toString()).join(', ') }]`;
	}

	/** @final */
	@strictEqual
	@CPObject.equalsDeco
	public override equal(value: CPObject): boolean {
		return value instanceof CollectionIndexed && this.isEqualTo(value as this, (this_, that_) => (
			xjs.Array.is<T>(this_.items, that_.items, language_values_equal)
		));
	}

	/** @final */
	public get(index: Integer, access_optional: boolean, accessor: AST.ASTNodeIndex | AST.ASTNodeExpression): T | Null {
		const n: number = this.items.length;
		const i: number = Number(index.toNumeric());
		return (
			(-n <= i && i < 0) ? this.items[i + n] :
			(0  <= i && i < n) ? this.items[i] :
			(access_optional) ? Null.NULL :
			throw_expression(new VoidError01(accessor))
		);
	}
}
