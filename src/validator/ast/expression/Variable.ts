import {
	ReferenceErrorUndeclared,
	ReferenceErrorKind,
} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import {
	SymbolKind,
	SymbolSchemaType,
	type SymbolSchemaVar,
} from '../../index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Validator} from '../../Validator.ts';
import {Expression} from './Expression.ts';
import type {Reassignable} from './Reassignable.ts';



export class Variable extends Expression implements Reassignable {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Variable {
		const expression: Expression = Expression.fromSource(src, config);
		assert_instanceof(expression, Variable);
		return expression;
	}


	public readonly id: bigint = Validator.cookTokenIdentifier(this.start_node.text);


	public constructor(start_node: SyntaxNodeType<'identifier'>) {
		super(start_node);
	}


	public override varCheck(): void {
		if (!this.validator.hasSymbol(this.id)) {
			throw new ReferenceErrorUndeclared(this);
		}
		if (this.validator.getSymbol(this.id) instanceof SymbolSchemaType) {
			throw new ReferenceErrorKind(this, SymbolKind.TYPE, SymbolKind.VALUE);
			// TODO: When Type objects are allowed as runtime values, this should be removed and checked by the type checker (`this#typeCheck`).
		}
	}

	/**
	 * @inheritdoc
	 * @implements Reassignable
	 */
	@memoizeMethod
	public writeType(): TYPE.Type {
		this.type(); // re-assert any assumptions and re-throw any errors
		return (this.validator.getSymbol(this.id) as SymbolSchemaVar).type;
	}
}
