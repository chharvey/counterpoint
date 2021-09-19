import * as assert from 'assert';
import {
	ReferenceError01,
	ReferenceError03,
	SolidConfig,
	CONFIG_DEFAULT,
	TOKEN,
	SolidType,
	SolidObject,
	Float64,
	INST,
	Builder,
	Validator,
	SymbolKind,
	SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
} from './package.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeVariable extends ASTNodeExpression {
	static override fromSource(src: string, config: SolidConfig = CONFIG_DEFAULT): ASTNodeVariable {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert.ok(expression instanceof ASTNodeVariable);
		return expression;
	}
	readonly id: bigint;
	constructor (start_node: TOKEN.TokenIdentifier) {
		super(start_node, {id: start_node.cook()})
		this.id = start_node.cook()!;
	}
	override shouldFloat(validator: Validator): boolean {
		return this.type(validator).isSubtypeOf(Float64);
	}
	override varCheck(validator: Validator): void {
		if (!validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		};
		if (validator.getSymbolInfo(this.id)! instanceof SymbolStructureType) {
			throw new ReferenceError03(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		};
	}
	protected override build_do(builder: Builder, to_float: boolean = false): INST.InstructionGlobalGet {
		return new INST.InstructionGlobalGet(this.id, to_float || this.shouldFloat(builder.validator));
	}
	protected override type_do(validator: Validator): SolidType {
		if (validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar) {
				return symbol.type;
			};
		};
		return SolidType.NEVER;
	}
	protected override assess_do(validator: Validator): SolidObject | null {
		if (validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar && !symbol.unfixed) {
				return symbol.value;
			};
		};
		return null;
	}
}
