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



export class ASTNodeVariable extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeVariable {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeVariable);
		return expression;
	}


	private _id: bigint | null = null; // TODO use memoize decorator

	constructor (start_node: TOKEN.TokenIdentifier | SyntaxNodeType<'identifier'>) {
		super(start_node);
	}

	get id(): bigint {
		return this._id ??= ('tree' in this.start_node)
			? this.validator.cookTokenIdentifier(this.start_node.text)
			: this.validator.cookTokenIdentifier(this.start_node.source);
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
