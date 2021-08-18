import * as assert from 'assert';
import {
	SolidConfig,
	CONFIG_DEFAULT,
} from '../core/index.js';
import type {TOKEN} from '../parser/index.js';
import {SolidType} from '../typer/index.js';
import {
	ReferenceError01,
	ReferenceError03,
} from '../error/index.js';
import {ASTNodeType} from './ASTNodeType.js';
import type {Validator} from './Validator.js';
import {
	SymbolKind,
	SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
} from './SymbolStructure.js';



export class ASTNodeTypeAlias extends ASTNodeType {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeTypeAlias {
		const typ: ASTNodeType = ASTNodeType.fromSource(src, config);
		assert.ok(typ instanceof ASTNodeTypeAlias);
		return typ;
	}
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenIdentifier) {
		super(start_node, {id: start_node.cook()})
		this.id = start_node.cook()!;
	}
	override varCheck(validator: Validator): void {
		if (!validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		};
		if (validator.getSymbolInfo(this.id)! instanceof SymbolStructureVar) {
			throw new ReferenceError03(this, SymbolKind.VALUE, SymbolKind.TYPE);
		};
	}
	protected override assess_do(validator: Validator): SolidType {
		if (validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureType) {
				return symbol.value;
			};
		};
		return SolidType.NEVER;
	}
}
