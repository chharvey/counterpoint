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
import {CoreLibName} from '../../../parser/index.ts';
import {
	SymbolKind,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaVar,
	SymbolSchemaFunc,
	SymbolSchemaClass,
} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {Type} from './Type.ts';



export class TypeAlias extends Type {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): TypeAlias {
		const typ: Type = Type.fromSource(src, config);
		assert_instanceof(typ, TypeAlias);
		return typ;
	}


	#isTypefuncRef: boolean = false;

	private readonly id: bigint = Validator.cookTokenIdentifier(this.start_node.text);


	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}


	public get isTypefuncRef(): boolean {
		return this.#isTypefuncRef;
	}


	public override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceErrorUndeclared(this);
		}
		const symbol: SymbolSchema = this.validator.getSymbol(this.id)!;
		if (symbol instanceof SymbolSchemaVar || symbol instanceof SymbolSchemaFunc) {
			throw new ReferenceErrorKind(this, SymbolKind.VALUE, SymbolKind.TYPE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		}
		if (symbol instanceof SymbolSchemaClass && symbol.classSignature.genericParams) {
			this.#isTypefuncRef = true;
			throw new ReferenceErrorKind(this, SymbolKind.TYPEFUNC, SymbolKind.TYPE);
		}
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		if (this.source === CoreLibName.OBJECT) {
			return TYPE.OBJ;
		}
		if (this.source === CoreLibName.EXCEPTION) {
			return TYPE.EXCP;
		}
		if (this.source === CoreLibName.CLASS) {
			return TYPE.CLASS;
		}
		assert.ok(this.validator.hasSymbol(this.id), `Expected ${this.source} (${this.id}) to be in the symbol table.`);
		const symbol: SymbolSchema = this.validator.getSymbol(this.id)!;
		assert_instanceof(symbol, SymbolSchemaType);
		return symbol.typevalue;
	}
}
