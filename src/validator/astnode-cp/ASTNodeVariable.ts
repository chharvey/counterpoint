import * as assert from 'assert';
import {
	TYPE,
	OBJ,
	INST,
	Builder,
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
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeVariable extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeVariable {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeVariable);
		return expression;
	}


	private _id: bigint | null = null; // TODO use memoize decorator

	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}

	public get id(): bigint {
		return this._id ??= this.validator.cookTokenIdentifier(this.start_node.text);
	}

	public override shouldFloat(): boolean {
		return this.type().isSubtypeOf(TYPE.FLOAT);
	}

	public override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		}
		if (this.validator.getSymbolInfo(this.id)! instanceof SymbolStructureType) {
			throw new ReferenceError03(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		}
	}

	protected override build_do(_builder: Builder, to_float: boolean = false): INST.InstructionGlobalGet {
		return new INST.InstructionGlobalGet(this.id, to_float || this.shouldFloat());
	}

	protected override type_do(): TYPE.Type {
		if (this.validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar) {
				return symbol.type;
			}
		}
		return TYPE.NEVER;
	}

	protected override fold_do(): OBJ.Object | null {
		if (this.validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar && !symbol.unfixed) {
				return symbol.value;
			}
		}
		return null;
	}
}
