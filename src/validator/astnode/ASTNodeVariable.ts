import * as assert from 'assert';
import {
	SolidType,
	SolidObject,
	Float64,
	INST,
	Builder,
	ReferenceError01,
	ReferenceError03,
	memoizeMethod,
	SolidConfig,
	CONFIG_DEFAULT,
	TOKEN,
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
	@memoizeMethod
	@ASTNodeExpression.buildDeco
	override build(builder: Builder, to_float: boolean = false): INST.InstructionExpression {
		return new INST.InstructionGlobalGet(this.id, to_float || this.shouldFloat(builder.validator));
	}
	@memoizeMethod
	@ASTNodeExpression.typeDeco
	override type(validator: Validator): SolidType {
		if (validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar) {
				return symbol.type;
			};
		};
		return SolidType.NEVER;
	}
	@memoizeMethod
	override fold(validator: Validator): SolidObject | null {
		if (validator.hasSymbol(this.id)) {
			const symbol: SymbolStructure = validator.getSymbolInfo(this.id)!;
			if (symbol instanceof SymbolStructureVar && !symbol.unfixed) {
				return symbol.value;
			};
		};
		return null;
	}
}
