import * as assert from 'assert';
import {
	TYPE,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
	memoizeGetter,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {
	SymbolKind,
	type SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
} from '../index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {
	ValidIntrinsicName,
	is_valid_intrinsic_name,
} from './utils-private.ts';
import {ASTNodeType} from './ASTNodeType.ts';



export class ASTNodeTypeAlias extends ASTNodeType {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeAlias {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert_instanceof(typ, ASTNodeTypeAlias);
		return typ;
	}


	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}

	@memoizeGetter
	public get id(): bigint {
		return this.validator.cookTokenIdentifier(this.start_node.text);
	}

	public override varCheck(): void {
		// NOTE: ignore var-checking `this` for now if source is an intrinsic identifier, as semantics is determined by syntax.
		if (is_valid_intrinsic_name(this.source)) {
			return;
		}
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceErrorUndeclared(this);
		}
		if (this.validator.getSymbolInfo(this.id) instanceof SymbolStructureVar) {
			throw new ReferenceErrorKind(this, SymbolKind.VALUE, SymbolKind.TYPE);
		}
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		if (is_valid_intrinsic_name(this.source)) {
			return new Map<ValidIntrinsicName, TYPE.Type>([
				[ValidIntrinsicName.OBJECT, TYPE.OBJ],
			]).get(this.source)!;
		}
		assert.ok(this.validator.hasSymbol(this.id), `Expected ${ this.source } (${ this.id }) to be in the symbol table.`);
		const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
		assert_instanceof(symbol, SymbolStructureType);
		return symbol.typevalue;
	}
}
