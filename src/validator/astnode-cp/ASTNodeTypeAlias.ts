import {
	TYPE,
	ReferenceError01,
	ReferenceError03,
} from '../../index.js';
import {
	assert_instanceof,
	memoizeMethod,
	memoizeGetter,
} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {
	SymbolKind,
	type SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import {ASTNodeType} from './ASTNodeType.js';



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
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		}
		if (this.validator.getSymbolInfo(this.id)! instanceof SymbolStructureVar) {
			throw new ReferenceError03(this, SymbolKind.VALUE, SymbolKind.TYPE);
		}
	}

	@memoizeMethod
	public override eval(): TYPE.Type {
		if (this.validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureType) {
				return symbol.typevalue;
			}
		}
		return TYPE.NEVER;
	}
}
