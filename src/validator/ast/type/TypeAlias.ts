import * as assert from 'node:assert';
import {
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import {
	SymbolKind,
	type SymbolSchema,
	SymbolSchemaType,
} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {IntrinsicName} from '../utils-private.ts';
import {Type} from './Type.ts';



export class TypeAlias extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeAlias {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeAlias);
		return typ;
	}


	private readonly id: bigint = Validator.cookTokenIdentifier(this.start_node.text);


	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}


	public override varCheck(): void {
		// NOTE: ignore var-checking `this` for now if source is an intrinsic identifier, as semantics is determined by syntax.
		if (this.source === IntrinsicName.OBJECT) {
			return;
		}
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceErrorUndeclared(this);
		}
		if (!(this.validator.getSymbol(this.id) instanceof SymbolSchemaType)) {
			throw new ReferenceErrorKind(this, SymbolKind.VALUE, SymbolKind.TYPE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		}
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		if (this.source === IntrinsicName.OBJECT) {
			return TYPE.OBJ;
		}
		assert.ok(this.validator.hasSymbol(this.id), `Expected ${ this.source } (${ this.id }) to be in the symbol table.`);
		const symbol: SymbolSchema = this.validator.getSymbol(this.id)!;
		assert_instanceof(symbol, SymbolSchemaType);
		return symbol.typevalue;
	}
}
