import * as assert from 'assert';
import {
	TYPE,
	ReferenceError01,
	ReferenceError03,
	CPConfig,
	CONFIG_DEFAULT,
	SymbolKind,
	SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';



export class ASTNodeTypeAlias extends ASTNodeType {
	static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeTypeAlias {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeAlias);
		return typ;
	}


	private _id: bigint | null = null; // TODO use memoize decorator

	constructor (start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}

	get id(): bigint {
		return this._id ??= this.validator.cookTokenIdentifier(this.start_node.text);
	}

	override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		};
		if (this.validator.getSymbolInfo(this.id)! instanceof SymbolStructureVar) {
			throw new ReferenceError03(this, SymbolKind.VALUE, SymbolKind.TYPE);
		};
	}
	protected override eval_do(): TYPE.SolidType {
		if (this.validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureType) {
				return symbol.typevalue;
			};
		};
		return TYPE.SolidType.NEVER;
	}
}
