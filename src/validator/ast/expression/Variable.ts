import {
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {
	SymbolKind,
	type SymbolSchema,
	SymbolSchemaType,
	SymbolSchemaFunc,
} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {Expression} from './Expression.ts';



export class Variable extends Expression {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Variable {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Variable);
		return expression;
	}


	#isFuncRef: boolean = false;

	public readonly id: bigint = Validator.cookTokenIdentifier(this.start_node.text);


	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}


	public get isFuncRef(): boolean {
		return this.#isFuncRef;
	}


	public override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceErrorUndeclared(this);
		}
		const symbol: SymbolSchema = this.validator.getSymbol(this.id)!;
		if (symbol instanceof SymbolSchemaType) {
			throw new ReferenceErrorKind(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		}
		if (symbol instanceof SymbolSchemaFunc) {
			this.#isFuncRef = true;
			throw new ReferenceErrorKind(this, SymbolKind.FUNC, SymbolKind.VALUE);
		}
	}
}
