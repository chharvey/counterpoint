import * as assert from 'assert';
import {
	SolidType,
	ReferenceError01,
	ReferenceError03,
	SolidConfig,
	CONFIG_DEFAULT,
	TOKEN,
	SymbolKind,
	SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
	SyntaxNodeType,
} from './package.js';
import {ASTNodeType} from './ASTNodeType.js';
import * as h from '../../../test/helpers-parse.js';



export class ASTNodeTypeAlias extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeAlias {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeAlias);
		return typ;
	}
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenIdentifier | SyntaxNodeType<'identifier'>) {
		const id = (('tree' in start_node)
			? h.tokenIdentifierFromTypeString(start_node.text)
			: start_node
		).cook();
		super(start_node, {id});
		this.id = id!;
	}
	override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		};
		if (this.validator.getSymbolInfo(this.id)! instanceof SymbolStructureVar) {
			throw new ReferenceError03(this, SymbolKind.VALUE, SymbolKind.TYPE);
		};
	}
	protected override eval_do(): SolidType {
		if (this.validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureType) {
				return symbol.typevalue;
			};
		};
		return SolidType.NEVER;
	}
}
