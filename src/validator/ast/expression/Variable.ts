import * as assert from 'node:assert';
import {
	OP,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	memoizeGetter,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	type VALUE,
	TYPE,
} from '../../../typer/index.ts';
import {
	SymbolKind,
	type SymbolSchema,
	SymbolSchemaVar,
	SymbolSchemaType,
} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Expression} from './Expression.ts';
import type {Reassignable} from './Reassignable.ts';



export class Variable extends Expression implements Reassignable {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Variable {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Variable);
		return expression;
	}


	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}

	@memoizeGetter
	public get id(): bigint {
		return this.validator.cookTokenIdentifier(this.start_node.text);
	}

	public override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceErrorUndeclared(this);
		}
		if (this.validator.getSymbol(this.id) instanceof SymbolSchemaType) {
			throw new ReferenceErrorKind(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		}
	}

	@memoizeMethod
	public override type(): TYPE.Type {
		assert.ok(this.validator.hasSymbol(this.id), `Expected ${ this.source } (${ this.id }) to be in the symbol table.`);
		const symbol: SymbolSchema = this.validator.getSymbol(this.id)!;
		assert_instanceof(symbol, SymbolSchemaVar);
		return symbol.isUninitialized ? symbol.type.union(TYPE.NULL) : symbol.type;
	}

	@memoizeMethod
	public override build(): OP.Get {
		return new OP.Get(this.validator.getSymbol(this.id) as SymbolSchemaVar);
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		assert.ok(this.validator.hasSymbol(this.id), `Expected ${ this.source } (${ this.id }) to be in the symbol table.`);
		const symbol: SymbolSchema = this.validator.getSymbol(this.id)!;
		assert_instanceof(symbol, SymbolSchemaVar);
		if (!symbol.isWritable) {
			return symbol.value;
		}
		return null;
	}

	/**
	 * @inheritdoc
	 * @implements Reassignable
	 */
	@memoizeMethod
	public writeType(): TYPE.Type {
		this.type(); // re-assert any assumptions and re-throw any errors
		return (this.validator.getSymbol(this.id) as SymbolSchemaVar).type;
	}
}
