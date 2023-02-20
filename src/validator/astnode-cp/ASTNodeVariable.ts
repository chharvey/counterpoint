import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
	Builder,
	ReferenceError01,
	ReferenceError03,
} from '../../index.js';
import {throw_expression} from '../../lib/index.js';
import {
	CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {
	SymbolKind,
	SymbolStructure,
	SymbolStructureVar,
	SymbolStructureType,
} from '../index.js';
import type {SyntaxNodeType} from '../utils-private.js';
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

	public override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceError01(this);
		}
		if (this.validator.getSymbolInfo(this.id)! instanceof SymbolStructureType) {
			throw new ReferenceError03(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		}
	}

	protected override build_do(builder: Builder): binaryen.ExpressionRef {
		const local = builder.getLocalInfo(this.id);
		return (local)
			? builder.module.local.get(local.index, local.type)
			: throw_expression(new ReferenceError(`Variable with id ${ this.id } not found.`));
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
