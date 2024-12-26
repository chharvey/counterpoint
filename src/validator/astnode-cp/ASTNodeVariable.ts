import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	type VALUE,
	type TYPE,
	type LocalInfo,
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
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
import {
	buildDeco,
	typeDeco,
} from './decorators.js';
import {ASTNodeExpression} from './ASTNodeExpression.js';



export class ASTNodeVariable extends ASTNodeExpression {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeVariable {
		const expression: ASTNodeExpression = ASTNodeExpression.fromSource(src, config);
		assert_instanceof(expression, ASTNodeVariable);
		return expression;
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
			throw new ReferenceErrorUndeclared(this);
		}
		if (this.validator.getSymbolInfo(this.id) instanceof SymbolStructureType) {
			throw new ReferenceErrorKind(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const local: LocalInfo | null = this.builder.getLocalInfo(this.id);
		return local
			? this.builder.module.local.get(local.index, local.type)
			: assert.fail(new ReferenceError(`Variable with id ${ this.id } not found.`));
	}

	@memoizeMethod
	@typeDeco
	public override type(): TYPE.Type {
		assert.ok(this.validator.hasSymbol(this.id), `Expected ${ this.source } (${ this.id }) to be in the symbol table.`);
		const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
		assert_instanceof(symbol, SymbolStructureVar);
		return symbol.type;
	}

	@memoizeMethod
	public override fold(): VALUE.Value | null {
		assert.ok(this.validator.hasSymbol(this.id), `Expected ${ this.source } (${ this.id }) to be in the symbol table.`);
		const symbol: SymbolStructure = this.validator.getSymbolInfo(this.id)!;
		assert_instanceof(symbol, SymbolStructureVar);
		if (!symbol.unfixed) {
			return symbol.value;
		}
		return null;
	}
}
