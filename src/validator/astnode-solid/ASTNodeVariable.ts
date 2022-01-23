import * as assert from 'assert';
import {
	SolidType,
	SolidObject,
	INST,
	Builder,
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
import {ASTNodeExpression} from './ASTNodeExpression.js';
import * as h from '../../../test/helpers-parse.js';



export class ASTNodeVariable extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeVariable {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeVariable);
		return expression;
	}
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenIdentifier | SyntaxNodeType<'identifier'>) {
		const id = (('tree' in start_node)
			? h.tokenIdentifierFromSource(start_node.text + ';')
			: start_node
		).cook();
		super(start_node, {id});
		this.id = id!;
	}
	override shouldFloat(): boolean {
		return this.type().isSubtypeOf(SolidType.FLOAT);
	}
	override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		};
		if (this.validator.getSymbolInfo(this.id)! instanceof SymbolStructureType) {
			throw new ReferenceError03(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		};
	}
	protected override build_do(_builder: Builder, to_float: boolean = false): INST.InstructionGlobalGet {
		return new INST.InstructionGlobalGet(this.id, to_float || this.shouldFloat());
	}
	protected override type_do(): SolidType {
		if (this.validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar) {
				return symbol.type;
			};
		};
		return SolidType.NEVER;
	}
	protected override fold_do(): SolidObject | null {
		if (this.validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar && !symbol.unfixed) {
				return symbol.value;
			};
		};
		return null;
	}
}
